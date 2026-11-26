import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { PGlite } from '@electric-sql/pglite';
import { pgcrypto } from '@electric-sql/pglite/contrib/pgcrypto';
import { uuid_ossp } from '@electric-sql/pglite/contrib/uuid_ossp';

const db = new PGlite({extensions:{ pgcrypto, uuid_ossp }});
const migrations = new URL('../supabase/migrations/', import.meta.url);
const id = {
  outlet: 'b0000000-0000-0000-0000-000000000001',
  cashier: '90000000-0000-0000-0000-000000000001',
  manager: '90000000-0000-0000-0000-000000000002',
  kitchen: '90000000-0000-0000-0000-000000000003',
  order: '80000000-0000-4000-8000-000000000001',
  secondOutlet: 'b0000000-0000-4000-8000-000000000002',
};
try {
  await db.exec(`
    CREATE ROLE anon; CREATE ROLE authenticated; CREATE ROLE service_role;
    CREATE SCHEMA auth;
    CREATE TABLE auth.users(id uuid PRIMARY KEY,email text,email_confirmed_at timestamptz);
    CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS
      $$ SELECT nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
    GRANT USAGE ON SCHEMA auth TO anon, authenticated;
    CREATE SCHEMA storage;
    CREATE TABLE storage.buckets(
      id text PRIMARY KEY, name text, public boolean, file_size_limit bigint, allowed_mime_types text[]
    );
    CREATE TABLE storage.objects(bucket_id text REFERENCES storage.buckets(id), name text);
    ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;
    GRANT USAGE ON SCHEMA storage TO anon, authenticated;
    GRANT INSERT ON storage.objects TO anon, authenticated;
    ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO authenticated;
  `);
  for (const file of (await readdir(migrations)).filter((file) => file.endsWith('.sql')).sort()) {
    await db.exec(await readFile(new URL(file, migrations), 'utf8'));
    console.log('Applied', file);
  }
  assert.equal((await db.query('SELECT count(*) AS n FROM public.outlets')).rows[0].n, 0);
  for (const fixture of ['demo_outlet.sql','demo_catalog.sql']) {
    await db.exec(await readFile(new URL('../supabase/fixtures/' + fixture, import.meta.url), 'utf8'));
  }
  const profiles = (await db.query(`SELECT p.id, r.code FROM public.profiles p JOIN public.outlet_memberships m ON m.profile_id=p.id JOIN public.roles r ON r.id=m.role_id WHERE m.outlet_id=$1`,[id.outlet])).rows;
  for (const role of ['cashier','manager','kitchen']) {
    const profile = profiles.find((profile) => profile.code === role);
    assert.ok(profile);
    await db.query('INSERT INTO auth.users VALUES ($1)',[id[role]]);
    await db.query('UPDATE public.profiles SET auth_user_id=$1 WHERE id=$2',[id[role],profile.id]);
  }
  await db.query(`INSERT INTO public.outlets(id,tenant_id,name,code,address_line1,city,state_id,pincode,phone,email)
    SELECT $1,tenant_id,'Second outlet','OUTLET-2',address_line1,city,state_id,pincode,phone,email
    FROM public.outlets WHERE id=$2`, [id.secondOutlet,id.outlet]);
  await db.query(`INSERT INTO public.outlet_memberships(outlet_id,profile_id,role_id,is_primary)
    SELECT $1,p.id,m.role_id,false FROM public.profiles p JOIN public.outlet_memberships m ON m.profile_id=p.id
    WHERE p.auth_user_id=$2 AND m.outlet_id=$3`, [id.secondOutlet,id.cashier,id.outlet]);
  const as = async (role) => {
    await db.exec('RESET ROLE');
    await db.query("SELECT set_config('request.jwt.claim.sub',$1,false)",[id[role]]);
    await db.exec('SET ROLE authenticated');
  };
  const single = async (_description, query, params) => (await db.query(`SELECT ${query} AS value`, params)).rows[0].value;
  await as('cashier');
  const session = await single('session','public.get_pos_session()');
  assert.equal(session.role,'cashier');
  assert.equal((await single('second session','public.get_pos_session($1)',[id.secondOutlet])).outletId,id.secondOutlet);
  assert.equal((await single('outlet list','public.get_pos_outlets()')).length,2);
  assert.ok(session.effectivePermissions.includes('orders.create'));
  const workspace = await single('workspace','public.get_pos_workspace()');
  assert.equal(workspace.orders.length,0);
  const product = workspace.products.find((p)=>p.isAvailable && p.price > 0);
  assert.ok(product);
  const opened = await single('workspace','public.get_pos_workspace()');
  assert.equal(opened.shifts.length, 0);
  const total = opened.settings.isGstEnabled
    ? Math.round(product.price + 2 * (Math.round(product.price * opened.settings.gstRate / 2) / 100))
    : product.price;
  const request = {
    id:id.order,items:[{ productId:product.id,quantity:1,addOns:[] }],
    orderType:'takeaway',paymentMode:'cash',cashTendered:total,expectedTotal:total
  };
  await assert.rejects(single('underpayment','public.pos_checkout($1)',[{...request,cashTendered:1}]),/Cash tendered/);
  const order=await single('checkout','public.pos_checkout($1)',[request]);
  assert.equal(order.total,total);
  assert.equal((await single('retry','public.pos_checkout($1)',[request])).invoiceNumber,order.invoiceNumber);
  await assert.rejects(single('changed retry','public.pos_checkout($1)',[{...request,cashTendered:total+1}]),/already succeeded/);
  assert.equal((await single('workspace','public.get_pos_workspace()')).orders.length,1);
  const otherOutlet = await single('second outlet','public.get_pos_workspace($1)',[id.secondOutlet]);
  assert.equal(otherOutlet.orders.length,0);
  assert.equal(otherOutlet.shifts.length,0);
  assert.notEqual(otherOutlet.settings.storeName,workspace.settings.storeName);
  await as('kitchen');
  assert.equal(await single('assignment','public.get_pos_session($1)',[id.secondOutlet]),null);
  const kitchen = await single('workspace','public.get_pos_workspace()');
  assert.equal(kitchen.tickets.length,1);
  await assert.rejects(single('checkout','public.pos_checkout($1)',[request]),/Checkout permission/);
  const ticket = kitchen.tickets[0];
  const setItemReady = (ready) => single('set kitchen item readiness', 'public.pos_set_ticket_item_ready($1,$2,$3,$4)',
    [ticket.id, ticket.items[0].id, ready, id.outlet]);
  await setItemReady(true);
  await setItemReady(true);
  assert.equal((await single('workspace','public.get_pos_workspace()')).orders[0].status,'ready');
  await setItemReady(false);
  await setItemReady(false);
  assert.equal((await single('workspace','public.get_pos_workspace()')).orders[0].status,'preparing');
  await setItemReady(true);
  await as('cashier');
  await assert.rejects(setItemReady(false), /Kitchen access required/);
  await as('manager');
  await single('refund','public.pos_refund($1,$2,$3,$4)',[order.id,'Customer refund','',id.outlet]);
  const afterRefund=await single('workspace','public.get_pos_workspace()');
  assert.equal(afterRefund.orders[0].paymentStatus,'refunded');
  assert.equal(afterRefund.tickets.length,0);
  assert.equal(afterRefund.shifts.length,0);
  await single('retry refund','public.pos_refund($1,$2,$3,$4)',[order.id,'Customer refund','',id.outlet]);
  assert.equal((await single('workspace','public.get_pos_workspace()')).orders[0].paymentStatus,'refunded');
  await single('settings','public.update_pos_preferences($1)',[{upiVpaId:'test@bank'}]);
  assert.equal((await single('workspace','public.get_pos_workspace()')).settings.upiVpaId,'test@bank');
  await single('menu edit','public.pos_catalog($1,$2,$3)', ['product',{id:product.id, name:'Updated dish'},id.outlet]);
  assert.equal((await single('workspace','public.get_pos_workspace()')).products.find((item)=>item.id===product.id).name,'Updated dish');
  const imagePath = id.outlet + '/9c80550e-c218-4df3-b07b-d178cb0ec6cd.png';
  const imageUrl = 'https://example.test/storage/v1/object/public/product-images/' + imagePath;
  const upload = (path) => db.query("INSERT INTO storage.objects(bucket_id, name) VALUES ('product-images', $1)", [path]);
  await upload(imagePath);
  await assert.rejects(upload(imagePath.replace(id.outlet, id.secondOutlet)), /row-level security/);
  await assert.rejects(upload('invalid-outlet/image.png'), /row-level security/);
  await assert.rejects(upload(imagePath.replace('.png', '.svg')), /row-level security/);
  await single('menu creation', 'public.pos_catalog($1,$2,$3)', [
    'product', { name: 'New dish with photo', price: 39.95, categoryId: product.categoryId, image: imageUrl }, id.outlet
  ]);
  const createdDish = (await single('register', 'public.get_register_workspace($1,$2)', [id.outlet, 'counter']))
    .products.find((item) => item.name === 'New dish with photo');
  assert.equal(createdDish.image, imageUrl);
  assert.equal(createdDish.price, 39.95);
  const updatedImage = imageUrl.replace('.png', '.webp');
  await upload(imagePath.replace('.png', '.webp'));
  await single('image replacement', 'public.pos_catalog($1,$2,$3)', [
    'product', { id: createdDish.id, image: updatedImage }, id.outlet
  ]);
  await as('cashier');
  await assert.rejects(upload(imagePath), /row-level security/);
  const cashierRegister = await single('register', 'public.get_register_workspace($1,$2)', [id.outlet, 'counter']);
  assert.equal(cashierRegister.products.find((item) => item.id === createdDish.id).image, updatedImage);
  const cardRequest = {...request, id:crypto.randomUUID(), paymentMode:'card', cashTendered:undefined};
  await as('cashier');
  const cardOrder=await single('card checkout','public.pos_checkout($1)',[cardRequest]);
  assert.notEqual(cardOrder.invoiceNumber,order.invoiceNumber);
  assert.equal(cardOrder.paymentReference,null);
  const upiOrder = await single('UPI checkout','public.pos_checkout($1)',[{...cardRequest, id:crypto.randomUUID(), paymentMode:'upi'}]);
  assert.equal(upiOrder.paymentMode,'upi');
  assert.equal(upiOrder.paymentReference,null);
  await as('manager');
  await assert.rejects(single('unconfirmed reversal','public.pos_refund($1,$2,$3,$4)',[cardOrder.id,'Customer refund','',id.outlet]),/refund reference/);
  await single('card refund','public.pos_refund($1,$2,$3,$4)',[cardOrder.id,'Customer refund','TEST-REFUND-1',id.outlet]);
  await as('cashier');
  const addOn = workspace.addOnGroups.flatMap((group) => group.items).find((item) => item.isAvailable && item.price > 0);
  const addOnTotal = opened.settings.isGstEnabled
    ? Math.round(addOn.price + 2 * (Math.round(addOn.price * opened.settings.gstRate / 2) / 100))
    : addOn.price;
  const extra = await single('standalone add-on','public.pos_checkout($1)',[{
    ...request,id:crypto.randomUUID(),items:[{productId:`addon_${addOn.id}`,quantity:1,addOns:[]}],
    expectedTotal:addOnTotal,cashTendered:addOnTotal,
  }]);
  assert.equal(extra.total,addOnTotal);
  assert.equal(extra.items[0].product.name,addOn.name);
  assert.equal(extra.shiftId, undefined);
  await assert.rejects(single('reports','public.get_register_workspace($1,$2)',[id.outlet,'reports']), /Reporting permission/);
  assert.ok((await single('today','public.get_register_workspace($1,$2)',[id.outlet,'counter'])).orders.length);
  const manage = action => single('manage display','public.manage_pickup_display($1,$2)',[id.outlet,action]);
  await assert.rejects(manage('open'), /settings access/);
  await as('manager');
  const display = await manage('open');
  const queue = () => single('pickup queue','public.pickup_queue($1)',[display]);
  await db.exec('RESET ROLE; SET ROLE anon');
  assert.deepEqual((await queue()).tickets.map(t => t.token).sort(), [extra.orderNumber, upiOrder.orderNumber].sort());
  assert.deepEqual(Object.keys((await queue()).tickets[0]).sort(), ['ready','token']);
  await as('kitchen');
  const activeTicket = (await single('workspace','public.get_pos_workspace()')).tickets.find(t => t.orderId === extra.id);
  await single('ready','public.pos_ticket($1,$2,$3)',[activeTicket.id,'status','ready']);
  assert.equal((await queue()).tickets.find(t => t.token === extra.orderNumber).ready,true);
  await single('collected','public.pos_ticket($1,$2,$3)',[activeTicket.id,'advance','ready']);
  assert.ok(!(await queue()).tickets.some(t => t.token === extra.orderNumber));
  await as('manager');
  await manage('disable');
  assert.equal(await queue(), null);
  const invite = await single('invite','public.invite_outlet_staff($1,$2,$3,$4)',[id.outlet,'clerk@example.test','Clerk','cashier']);
  await assert.rejects(single('owner invitation','public.invite_outlet_staff($1,$2,$3,$4)',[id.outlet,'owner@example.test','Owner','owner']), /permission/);
  await db.exec('RESET ROLE');
  const employeeId = crypto.randomUUID();
  await db.query("INSERT INTO auth.users VALUES ($1,'clerk@example.test',now())",[employeeId]);
  await db.query("SELECT set_config('request.jwt.claim.sub',$1,false)",[employeeId]);
  await db.exec('SET ROLE authenticated');
  await single('accept','public.accept_staff_invitation($1)',[invite]);
  const employee = await single('session','public.get_pos_session()');
  assert.equal(employee.role,'cashier');
  await assert.rejects(single('reuse','public.accept_staff_invitation($1)',[invite]),/expired/);
  await as('manager');
  await single('disable','public.disable_outlet_staff($1,$2)',[id.outlet,employee.id]);
  await db.query("SELECT set_config('request.jwt.claim.sub',$1,false)",[employeeId]);
  assert.equal(await single('revoked','public.get_pos_session()'),null);
  console.log('Passed authenticated outlet isolation, shift-free checkout, cash validation, checkout retry, KDS, refund, manual payment references, settings, and catalog checks.');
} catch (error) {
  console.error(error.message, error.detail ?? '', error.where ?? '', error.code ?? '');
  process.exitCode=1;
} finally {
  await db.close();
}

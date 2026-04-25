import React, { useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { ShoppingCart, CalendarDays, Truck, PackageCheck, MapPinned, CreditCard, Fish, Plus, Minus, Trash2, Lock, Settings, ImagePlus, Save, LogOut, Download, Eye, EyeOff } from 'lucide-react';
import './styles.css';

const DEFAULT_PRODUCTS = [
  {
    id: 'uni-250g', active: true, name: 'Premium Japanese Uni Tray', origin: 'Japan', price: 128, unit: '250g tray', tag: 'Best Seller', inventory: 20,
    description: 'Sweet, creamy omakase-grade sea urchin imported directly from Japan.',
    images: ['https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?q=80&w=1200&auto=format&fit=crop']
  },
  {
    id: 'otoro-block', active: true, name: 'Bluefin Otoro Block', origin: 'Japan / Toyosu Market', price: 98, unit: 'per pack', tag: 'Sashimi Grade', inventory: 15,
    description: 'Rich fatty tuna belly for DIY sashimi, sushi, or omakase dinner at home.',
    images: ['https://images.unsplash.com/photo-1617196034796-73dfa7b1fd56?q=80&w=1200&auto=format&fit=crop']
  },
  {
    id: 'ikura-250g', active: true, name: 'Japanese Ikura', origin: 'Hokkaido', price: 58, unit: '250g jar', tag: 'Limited', inventory: 30,
    description: 'Bright, savory salmon roe. Perfect for rice bowls and hand rolls.',
    images: ['https://images.unsplash.com/photo-1611143669185-af224c5e3252?q=80&w=1200&auto=format&fit=crop']
  }
];
const DEFAULT_SETTINGS = {
  brandName: 'Uniya', motto: 'Bring Omakase to Home', heroTitle: 'Bring Omakase to Home',
  heroText: 'Premium uni, sashimi-grade seafood, and Japanese delicacies imported directly from Japan. Order online for Wednesday or Saturday local delivery, or cold-chain shipping.',
  deliveryDays: [3,6], localDeliveryFee: 15, shippingFee: 35, stripeCheckoutUrl: '', contactEmail: 'sales@uniya.com'
};
const LS_PRODUCTS = 'uniya_products_v03';
const LS_SETTINGS = 'uniya_settings_v03';
const LS_ORDERS = 'uniya_orders_v03';
const LS_ADMIN = 'uniya_admin_logged_in_v03';
const ADMIN_PASSWORD = '123456';

function load(key, fallback){ try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; } }
function save(key, value){ localStorage.setItem(key, JSON.stringify(value)); }
function currency(n){ return `$${Number(n||0).toFixed(2)}`; }
function ymd(d){ return d.toISOString().slice(0,10); }
function nextDeliveryDates(days, count=10){ const dates=[]; const d=new Date(); d.setHours(0,0,0,0); while(dates.length<count){ if(days.includes(d.getDay())) dates.push(new Date(d)); d.setDate(d.getDate()+1); } return dates; }
function downloadJson(name, data){ const blob = new Blob([JSON.stringify(data,null,2)], {type:'application/json'}); const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download=name; a.click(); URL.revokeObjectURL(a.href); }
function downloadCsv(name, rows){ const csv = rows.map(r => r.map(v => `"${String(v??'').replaceAll('"','""')}"`).join(',')).join('\n'); const blob = new Blob([csv], {type:'text/csv'}); const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download=name; a.click(); URL.revokeObjectURL(a.href); }

function App(){
  const [page,setPage]=useState(location.hash === '#admin' ? 'admin' : 'shop');
  const [products,setProducts]=useState(()=>load(LS_PRODUCTS, DEFAULT_PRODUCTS));
  const [settings,setSettings]=useState(()=>load(LS_SETTINGS, DEFAULT_SETTINGS));
  const [orders,setOrders]=useState(()=>load(LS_ORDERS, []));
  const persistProducts=(p)=>{setProducts(p);save(LS_PRODUCTS,p)};
  const persistSettings=(s)=>{setSettings(s);save(LS_SETTINGS,s)};
  const persistOrders=(o)=>{setOrders(o);save(LS_ORDERS,o)};
  return <>{page==='admin' ? <Admin products={products} setProducts={persistProducts} settings={settings} setSettings={persistSettings} orders={orders} setOrders={persistOrders} goShop={()=>setPage('shop')} /> : <Shop products={products} settings={settings} orders={orders} setOrders={persistOrders} goAdmin={()=>setPage('admin')} />}</>;
}

function Shop({products,settings,orders,setOrders,goAdmin}){
  const activeProducts = products.filter(p=>p.active);
  const [cart,setCart]=useState({});
  const [fulfillment,setFulfillment]=useState('local');
  const dates=useMemo(()=>nextDeliveryDates(settings.deliveryDays),[settings.deliveryDays]);
  const [selectedDate,setSelectedDate]=useState(ymd(dates[0] || new Date()));
  const [customer,setCustomer]=useState({name:'',email:'',phone:'',address:'',notes:''});
  const cartLines=activeProducts.map(p=>({...p,qty:cart[p.id]||0})).filter(p=>p.qty>0);
  const subtotal=cartLines.reduce((s,p)=>s+Number(p.price)*p.qty,0);
  const fee=subtotal>0?(fulfillment==='local'?Number(settings.localDeliveryFee):Number(settings.shippingFee)):0;
  const total=subtotal+fee;
  const add=id=>setCart(c=>({...c,[id]:(c[id]||0)+1}));
  const remove=id=>setCart(c=>({...c,[id]:Math.max((c[id]||0)-1,0)}));
  const submitOrder=()=>{
    if(!cartLines.length) return alert('Please add at least one product.');
    if(!customer.name || !customer.phone || !customer.address) return alert('Please enter name, phone and address.');
    const order={id:'U'+Date.now(), createdAt:new Date().toISOString(), status:'pending payment', fulfillment, requestedDate:selectedDate, customer, items:cartLines.map(({id,name,price,unit,qty})=>({id,name,price,unit,qty})), subtotal, fee, total};
    setOrders([order,...orders]);
    if(settings.stripeCheckoutUrl){ window.location.href=settings.stripeCheckoutUrl; } else { alert('Order saved in demo mode. Stripe checkout URL is not configured yet. Go to Admin > Site Settings to add it later.'); setCart({}); }
  };
  return <div className="app">
    <header className="topbar"><div><div className="logo">{settings.brandName}</div><div className="motto">{settings.motto}</div></div><nav><a href="#about">About</a><a href="#products">Products</a><a href="#delivery">Order</a><button onClick={goAdmin} className="smallBtn"><Settings size={16}/> Admin</button></nav><div className="cartPill"><ShoppingCart size={16}/>{cartLines.reduce((s,p)=>s+p.qty,0)}</div></header>
    <section className="hero"><div className="heroText"><span className="badge">Fresh Japanese seafood, curated for home omakase</span><h1>{settings.heroTitle}</h1><p>{settings.heroText}</p><a className="primary" href="#products">Shop Products</a></div><div className="heroCard"><img src="https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?q=80&w=1200&auto=format&fit=crop"/></div></section>
    <section id="about" className="features">{[[Fish,'Direct from Japan','Premium seafood suitable for omakase-style dining at home.'],[CalendarDays,'Wed / Sat Schedule','Fixed local delivery or ship-out dates.'],[Truck,'Local Delivery','Bay Area local delivery route tools coming in next phases.'],[PackageCheck,'Cold Shipping','Non-local customers can choose shipping.']].map(([Icon,t,d])=><div className="feature" key={t}><Icon className="gold"/><h3>{t}</h3><p>{d}</p></div>)}</section>
    <section id="products"><div className="sectionTitle"><div><span>Product Catalogue</span><h2>Featured Products</h2></div></div><div className="grid">{activeProducts.map(p=><div className="product" key={p.id}><div className="photo"><img src={p.images?.[0] || ''}/><b>{p.tag}</b></div><div className="productBody"><small>{p.origin}</small><h3>{p.name}</h3><p>{p.description}</p><div className="row"><div><strong>{currency(p.price)}</strong><em>{p.unit}</em></div><div className="qty"><button onClick={()=>remove(p.id)}><Minus size={15}/></button><span>{cart[p.id]||0}</span><button onClick={()=>add(p.id)}><Plus size={15}/></button></div></div></div></div>)}</div></section>
    <section id="delivery" className="checkout"><div className="panel"><span>Checkout v0.3</span><h2>Delivery / Shipping Info</h2><div className="choice"><button className={fulfillment==='local'?'on':''} onClick={()=>setFulfillment('local')}><Truck/>Local Delivery</button><button className={fulfillment==='shipping'?'on':''} onClick={()=>setFulfillment('shipping')}><PackageCheck/>Cold Shipping</button></div><label>Requested {fulfillment==='local'?'delivery':'ship-out'} date</label><select value={selectedDate} onChange={e=>setSelectedDate(e.target.value)}>{dates.map(d=><option key={ymd(d)} value={ymd(d)}>{d.toLocaleDateString(undefined,{weekday:'long',month:'short',day:'numeric'})}</option>)}</select><div className="formGrid"><input placeholder="Customer name *" value={customer.name} onChange={e=>setCustomer({...customer,name:e.target.value})}/><input placeholder="Phone *" value={customer.phone} onChange={e=>setCustomer({...customer,phone:e.target.value})}/><input placeholder="Email" value={customer.email} onChange={e=>setCustomer({...customer,email:e.target.value})}/><input placeholder="Address *" value={customer.address} onChange={e=>setCustomer({...customer,address:e.target.value})}/><textarea placeholder="Order notes" value={customer.notes} onChange={e=>setCustomer({...customer,notes:e.target.value})}/></div></div><div className="panel"><h2>Cart</h2>{cartLines.length===0 && <p className="mutedBox">Cart is empty.</p>}{cartLines.map(p=><div className="cartLine" key={p.id}><div><b>{p.name}</b><small>{p.qty} × {currency(p.price)}</small></div><button onClick={()=>setCart(c=>({...c,[p.id]:0}))}><Trash2 size={16}/></button></div>)}<div className="totals"><p><span>Subtotal</span><b>{currency(subtotal)}</b></p><p><span>{fulfillment==='local'?'Delivery':'Shipping'}</span><b>{currency(fee)}</b></p><p className="grand"><span>Total</span><b>{currency(total)}</b></p></div><button className="primary full" onClick={submitOrder}><CreditCard size={18}/> Place Order / Stripe Checkout</button><p className="tiny">v0.3 saves the order locally for testing. Stripe URL can be configured in Admin.</p></div></section>
    <footer>© 2026 {settings.brandName}. {settings.motto}.</footer>
  </div>;
}

function Admin({products,setProducts,settings,setSettings,orders,setOrders,goShop}){
  const [logged,setLogged]=useState(()=>localStorage.getItem(LS_ADMIN)==='yes');
  const [password,setPassword]=useState('');
  const [tab,setTab]=useState('products');
  if(!logged) return <div className="adminLogin"><div className="loginBox"><Lock className="gold" size={34}/><h1>Uniya Admin</h1><p>Demo password: 123456. Change this before real launch.</p><input type="password" placeholder="Admin password" value={password} onChange={e=>setPassword(e.target.value)} onKeyDown={e=>{if(e.key==='Enter'&&password===ADMIN_PASSWORD){localStorage.setItem(LS_ADMIN,'yes');setLogged(true)}}}/><button className="primary full" onClick={()=>{if(password===ADMIN_PASSWORD){localStorage.setItem(LS_ADMIN,'yes');setLogged(true)}else alert('Wrong password')}}>Login</button><button className="ghost full" onClick={goShop}>Back to website</button></div></div>;
  const addProduct=()=>setProducts([{id:'product-'+Date.now(),active:true,name:'New Product',origin:'Japan',price:0,unit:'',tag:'New',inventory:0,description:'',images:['']},...products]);
  const updateProduct=(id,patch)=>setProducts(products.map(p=>p.id===id?{...p,...patch}:p));
  const deleteProduct=id=>confirm('Delete this product?') && setProducts(products.filter(p=>p.id!==id));
  const supplierRows=()=>{ const map={}; orders.forEach(o=>o.items.forEach(i=>{ map[i.name]=map[i.name]||{name:i.name,qty:0,unit:i.unit}; map[i.name].qty+=i.qty; })); return [['Product','Total Qty','Unit'],...Object.values(map).map(x=>[x.name,x.qty,x.unit])]; };
  const orderRows=()=>[['Order ID','Date','Type','Customer','Phone','Address','Total','Status'],...orders.map(o=>[o.id,o.requestedDate,o.fulfillment,o.customer.name,o.customer.phone,o.customer.address,o.total,o.status])];
  return <div className="admin"><aside><h1>Uniya Admin</h1><button className={tab==='products'?'sel':''} onClick={()=>setTab('products')}>Products</button><button className={tab==='settings'?'sel':''} onClick={()=>setTab('settings')}>Site Settings</button><button className={tab==='orders'?'sel':''} onClick={()=>setTab('orders')}>Orders</button><button className={tab==='delivery'?'sel':''} onClick={()=>setTab('delivery')}>Delivery Routes</button><hr/><button onClick={goShop}><Eye size={16}/> View Website</button><button onClick={()=>{localStorage.removeItem(LS_ADMIN);setLogged(false)}}><LogOut size={16}/> Logout</button></aside><main>
    {tab==='products'&&<><div className="adminHead"><div><span>Builder Page v0.2</span><h2>Product Catalogue Editor</h2></div><button className="primary" onClick={addProduct}><Plus size={16}/> Add Product</button></div>{products.map(p=><div className="editCard" key={p.id}><div className="editTop"><h3>{p.name}</h3><button className="danger" onClick={()=>deleteProduct(p.id)}>Delete</button></div><div className="editGrid"><label>Active <button className="mini" onClick={()=>updateProduct(p.id,{active:!p.active})}>{p.active?<><Eye size={14}/> Visible</>:<><EyeOff size={14}/> Hidden</>}</button></label><input value={p.name} onChange={e=>updateProduct(p.id,{name:e.target.value})} placeholder="Product name"/><input value={p.origin} onChange={e=>updateProduct(p.id,{origin:e.target.value})} placeholder="Origin"/><input type="number" value={p.price} onChange={e=>updateProduct(p.id,{price:Number(e.target.value)})} placeholder="Price"/><input value={p.unit} onChange={e=>updateProduct(p.id,{unit:e.target.value})} placeholder="Unit"/><input value={p.tag} onChange={e=>updateProduct(p.id,{tag:e.target.value})} placeholder="Tag"/><input type="number" value={p.inventory} onChange={e=>updateProduct(p.id,{inventory:Number(e.target.value)})} placeholder="Inventory"/><textarea value={p.description} onChange={e=>updateProduct(p.id,{description:e.target.value})} placeholder="Description"/><textarea value={(p.images||[]).join('\n')} onChange={e=>updateProduct(p.id,{images:e.target.value.split('\n').filter(Boolean)})} placeholder="Image URLs, one per line"/></div></div>)}</>}
    {tab==='settings'&&<><div className="adminHead"><div><span>Website Builder</span><h2>Site Settings</h2></div><button className="primary" onClick={()=>{save(LS_SETTINGS,settings);alert('Saved')}}><Save size={16}/> Save</button></div><div className="editCard"><div className="editGrid"><input value={settings.brandName} onChange={e=>setSettings({...settings,brandName:e.target.value})} placeholder="Brand name"/><input value={settings.motto} onChange={e=>setSettings({...settings,motto:e.target.value})} placeholder="Motto"/><input value={settings.heroTitle} onChange={e=>setSettings({...settings,heroTitle:e.target.value})} placeholder="Hero title"/><textarea value={settings.heroText} onChange={e=>setSettings({...settings,heroText:e.target.value})} placeholder="Hero text"/><input type="number" value={settings.localDeliveryFee} onChange={e=>setSettings({...settings,localDeliveryFee:Number(e.target.value)})} placeholder="Local delivery fee"/><input type="number" value={settings.shippingFee} onChange={e=>setSettings({...settings,shippingFee:Number(e.target.value)})} placeholder="Shipping fee"/><input value={settings.stripeCheckoutUrl} onChange={e=>setSettings({...settings,stripeCheckoutUrl:e.target.value})} placeholder="Stripe payment link / checkout URL"/><input value={settings.contactEmail} onChange={e=>setSettings({...settings,contactEmail:e.target.value})} placeholder="Contact email"/></div><p className="tiny">Delivery days are currently fixed as Wednesday and Saturday per v0.3. We can make this editable next.</p></div></>}
    {tab==='orders'&&<><div className="adminHead"><div><span>Operations v0.3</span><h2>Orders</h2></div><div className="actions"><button onClick={()=>downloadCsv('uniya_orders.csv',orderRows())}><Download size={16}/> Export Orders CSV</button><button onClick={()=>downloadCsv('uniya_supplier_list.csv',supplierRows())}><Download size={16}/> Supplier List CSV</button><button onClick={()=>downloadJson('uniya_orders_backup.json',orders)}><Download size={16}/> Backup JSON</button></div></div><div className="tableWrap"><table><thead><tr>{orderRows()[0].map(h=><th key={h}>{h}</th>)}</tr></thead><tbody>{orderRows().slice(1).map(r=><tr key={r[0]}>{r.map((c,i)=><td key={i}>{c}</td>)}</tr>)}</tbody></table></div></>}
    {tab==='delivery'&&<><div className="adminHead"><div><span>Route Management Preview</span><h2>Driver Route List</h2></div></div><div className="editCard"><p>This phase will become a driver page with stop order, Google Maps navigation link, phone call/text button, ETA message, and delivered status.</p>{orders.map(o=><div className="routeStop" key={o.id}><MapPinned className="gold"/><div><b>{o.customer.name}</b><p>{o.customer.address}</p><p>{o.customer.phone} · {o.requestedDate} · {currency(o.total)}</p></div><a target="_blank" href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(o.customer.address)}`}>Open Maps</a></div>)}</div></>}
  </main></div>;
}

createRoot(document.getElementById('root')).render(<App/>);

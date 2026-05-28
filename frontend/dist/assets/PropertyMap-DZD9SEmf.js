import{j as d}from"./index-CpSLSp3k.js";import{r}from"./router-zhNTuBJE.js";import{L as e}from"./maps-BzpSBDnw.js";delete e.Icon.Default.prototype._getIconUrl;e.Icon.Default.mergeOptions({iconRetinaUrl:"https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",iconUrl:"https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",shadowUrl:"https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png"});const y=({properties:a=[],onPropertyClick:o,center:p=[9.03,38.74],zoom:m=13,height:u="500px"})=>{const i=r.useRef(null),[n,f]=r.useState(null);return r.useEffect(()=>{if(!i.current){const t=e.map("property-map-container").setView(p,m);e.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",{attribution:'&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'}).addTo(t),e.control.zoom({position:"bottomright"}).addTo(t),f(t),i.current=t}return()=>{i.current&&(i.current.remove(),i.current=null)}},[]),r.useEffect(()=>{if(n)return n.eachLayer(t=>{t instanceof e.Marker&&n.removeLayer(t)}),a.forEach(t=>{var l;const h=[t.latitude||9.03,t.longitude||38.74];let s="#3b82f6";t.listing_type==="sale"&&(s="#ef4444");const g=e.divIcon({html:`<div style="background-color: ${s}; width: 30px; height: 30px; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.2);">
                ${t.listing_type==="sale"?"💰":"🏠"}
               </div>`,iconSize:[30,30],className:"custom-marker"}),c=e.marker(h,{icon:g}).addTo(n),x=`
        <div style="min-width: 260px; padding: 5px;">
          <h4 style="margin: 0 0 8px; color: #1f2937;">${t.title}</h4>
          <p style="color: #0d9488; font-weight: bold; margin: 0 0 8px;">
            ETB ${(l=t.price)==null?void 0:l.toLocaleString()}${t.listing_type==="rent"?"/month":""}
          </p>
          <p style="margin: 0 0 8px; font-size: 12px; color: #6b7280;">📍 ${t.address||t.city}</p>
          <button onclick="window.dispatchEvent(new CustomEvent('propertyClick', { detail: ${JSON.stringify(t)} }))" 
                  style="background: #0d9488; color: white; border: none; padding: 6px 12px; border-radius: 6px; cursor: pointer; width: 100%;">
            View Details →
          </button>
        </div>
      `;c.bindPopup(x),c.on("click",()=>{o&&o(t)})}),window.addEventListener("propertyClick",t=>{o&&o(t.detail)}),()=>{window.removeEventListener("propertyClick",()=>{})}},[n,a,o]),d.jsx("div",{style:{height:u,width:"100%",position:"relative"},children:d.jsx("div",{id:"property-map-container",style:{height:"100%",width:"100%",borderRadius:"12px"}})})};export{y as default};

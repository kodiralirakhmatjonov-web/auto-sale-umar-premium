1:"$Sreact.fragment"
3:I[39756,["/_next/static/chunks/3fntmmi971322.js"],"default"]
4:I[37457,["/_next/static/chunks/3fntmmi971322.js"],"default"]
a:I[68027,["/_next/static/chunks/3fntmmi971322.js"],"default",1]
:HL["/_next/static/chunks/1-z5e9oyj4lgl.css","style"]
:HL["/_next/static/chunks/2islu7llorasc.css","style"]
:HL["/_next/static/chunks/39e3-lo3vtiw0.css","style"]
2:T776,
(() => {
  const syncThemeColor = (color) => {
    const metas = Array.from(document.querySelectorAll('meta[name="theme-color"]'));
    let primary = metas.find((meta) => !meta.hasAttribute("media")) || metas[0];

    if (!primary) {
      primary = document.createElement("meta");
      primary.setAttribute("name", "theme-color");
      document.head.appendChild(primary);
    }

    primary.removeAttribute("media");
    primary.setAttribute("content", color);
    primary.setAttribute("data-asu-theme-color", "true");

    metas.forEach((meta) => {
      if (meta !== primary) meta.setAttribute("content", color);
    });
  };

  try {
    const stored = localStorage.getItem("asu-theme");
    const theme =
      stored === "light" || stored === "dark"
        ? stored
        : (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");

    document.documentElement.dataset.asuTheme = theme;
    document.documentElement.style.colorScheme = theme;
    const color = theme === "light" ? "#f5f5f3" : "#0b0c0d";
    document.documentElement.style.backgroundColor = color;
    syncThemeColor(color);

    const syncBody = () => {
      if (document.body) {
        document.body.dataset.asuTheme = theme;
        document.body.style.backgroundColor = color;
      }
      syncThemeColor(color);
    };

    if (document.body) syncBody();
    else document.addEventListener("DOMContentLoaded", syncBody, { once: true });

    new MutationObserver(() => {
      const currentTheme = document.documentElement.dataset.asuTheme;
      syncThemeColor(currentTheme === "dark" ? "#0b0c0d" : "#f5f5f3");
    }).observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-asu-theme"],
    });
  } catch (_) {
    document.documentElement.dataset.asuTheme = "light";
    document.documentElement.style.backgroundColor = "#f5f5f3";
    syncThemeColor("#f5f5f3");
  }
})();
8:X
0:{"P":null,"c":["","admin","staff",""],"q":"","i":false,"f":[[["",{"children":["admin",{"children":["staff",{"children":["__PAGE__",{},"$undefined","$undefined",4608]},"$undefined","$undefined",4608]},"$undefined","$undefined",4608]},"$undefined","$undefined",4624],[["$","$1","c",{"children":[[["$","link","0",{"rel":"stylesheet","href":"/_next/static/chunks/1-z5e9oyj4lgl.css","precedence":"next","crossOrigin":"$undefined","nonce":"$undefined"}],["$","script","script-0",{"src":"/_next/static/chunks/3fntmmi971322.js","async":true,"nonce":"$undefined"}]],["$","html",null,{"lang":"ru","suppressHydrationWarning":true,"children":[["$","head",null,{"children":["$","script",null,{"dangerouslySetInnerHTML":{"__html":"$2"}}]}],["$","body",null,{"children":["$","$L3",null,{"parallelRouterKey":"children","error":"$undefined","errorStyles":"$undefined","errorScripts":"$undefined","template":["$","$L4",null,{}],"templateStyles":"$undefined","templateScripts":"$undefined","notFound":[[["$","title",null,{"children":"404: This page could not be found."}],["$","div",null,{"style":{"fontFamily":"system-ui,\"Segoe UI\",Roboto,Helvetica,Arial,sans-serif,\"Apple Color Emoji\",\"Segoe UI Emoji\"","height":"100vh","textAlign":"center","display":"flex","flexDirection":"column","alignItems":"center","justifyContent":"center"},"children":["$","div",null,{"children":[["$","style",null,{"dangerouslySetInnerHTML":{"__html":"body{color:#000;background:#fff;margin:0}.next-error-h1{border-right:1px solid rgba(0,0,0,.3)}@media (prefers-color-scheme:dark){body{color:#fff;background:#000}.next-error-h1{border-right:1px solid rgba(255,255,255,.3)}}"}}],["$","h1",null,{"className":"next-error-h1","style":{"display":"inline-block","margin":"0 20px 0 0","padding":"0 23px 0 0","fontSize":24,"fontWeight":500,"verticalAlign":"top","lineHeight":"49px"},"children":404}],["$","div",null,{"style":{"display":"inline-block"},"children":["$","h2",null,{"style":{"fontSize":14,"fontWeight":400,"lineHeight":"49px","margin":0},"children":"This page could not be found."}]}]]}]}]],[]],"forbidden":"$undefined","unauthorized":"$undefined"}]}]]}]]}],{"children":["$L5",{"children":["$L6",{"children":["$L7",{},null,false,null]},null,false,"$8"]},null,false,null]},null,false,null],"$L9",false]],"m":"$undefined","G":["$a",["$Lb"]],"S":true,"h":null,"r":"$undefined","s":"$undefined","a":"$undefined","l":"$undefined","p":"$undefined","d":"$undefined","b":"BvVLHwqjcYYeoIgycrz60"}
c:I[47257,["/_next/static/chunks/3fntmmi971322.js"],"ClientPageRoot"]
d:I[20880,["/_next/static/chunks/3fntmmi971322.js","/_next/static/chunks/1-gpd91mk6lqg.js"],"default"]
10:I[97367,["/_next/static/chunks/3fntmmi971322.js"],"OutletBoundary"]
11:"$Sreact.suspense"
13:I[97367,["/_next/static/chunks/3fntmmi971322.js"],"ViewportBoundary"]
15:I[97367,["/_next/static/chunks/3fntmmi971322.js"],"MetadataBoundary"]
5:["$","$1","c",{"children":[null,["$","$L3",null,{"parallelRouterKey":"children","error":"$undefined","errorStyles":"$undefined","errorScripts":"$undefined","template":["$","$L4",null,{}],"templateStyles":"$undefined","templateScripts":"$undefined","notFound":"$undefined","forbidden":"$undefined","unauthorized":"$undefined"}]]}]
6:["$","$1","c",{"children":[null,["$","$L3",null,{"parallelRouterKey":"children","error":"$undefined","errorStyles":"$undefined","errorScripts":"$undefined","template":["$","$L4",null,{}],"templateStyles":"$undefined","templateScripts":"$undefined","notFound":"$undefined","forbidden":"$undefined","unauthorized":"$undefined"}]]}]
7:["$","$1","c",{"children":[["$","$Lc",null,{"Component":"$d","serverProvidedParams":{"searchParams":{},"params":{},"promises":["$@e","$@f"]}}],[["$","link","0",{"rel":"stylesheet","href":"/_next/static/chunks/2islu7llorasc.css","precedence":"next","crossOrigin":"$undefined","nonce":"$undefined"}],["$","link","1",{"rel":"stylesheet","href":"/_next/static/chunks/39e3-lo3vtiw0.css","precedence":"next","crossOrigin":"$undefined","nonce":"$undefined"}],["$","script","script-0",{"src":"/_next/static/chunks/1-gpd91mk6lqg.js","async":true,"nonce":"$undefined"}]],["$","$L10",null,{"children":["$","$11",null,{"name":"Next.MetadataOutlet","children":"$@12"}]}]]}]
9:["$","$1","h",{"children":[null,["$","$L13",null,{"children":"$L14"}],["$","div",null,{"hidden":true,"children":["$","$L15",null,{"children":["$","$11",null,{"name":"Next.Metadata","children":"$L16"}]}]}],null]}]
b:["$","link","0",{"rel":"stylesheet","href":"/_next/static/chunks/1-z5e9oyj4lgl.css","precedence":"next","crossOrigin":"$undefined","nonce":"$undefined"}]
8:C
e:{}
f:"$7:props:children:0:props:serverProvidedParams:params"
14:[["$","meta","0",{"charSet":"utf-8"}],["$","meta","1",{"name":"viewport","content":"width=device-width, initial-scale=1, viewport-fit=cover"}],["$","meta","2",{"name":"theme-color","content":"#f5f5f3"}]]
17:I[27201,["/_next/static/chunks/3fntmmi971322.js"],"IconMark"]
12:null
16:[["$","title","0",{"children":"Auto Sale Umar — премиальные автомобили и международная поставка"}],["$","meta","1",{"name":"description","content":"Auto Sale Umar — премиальный автомобильный шоурум в Ташкенте. Автомобили в наличии и под заказ, подбор и международная поставка из США, Канады, Кореи, ОАЭ, Европы и других рынков."}],["$","meta","2",{"name":"application-name","content":"Auto Sale Umar"}],["$","link","3",{"rel":"manifest","href":"/site.webmanifest","crossOrigin":"$undefined"}],["$","meta","4",{"name":"creator","content":"Auto Sale Umar"}],["$","meta","5",{"name":"publisher","content":"Auto Sale Umar"}],["$","meta","6",{"name":"robots","content":"noindex, nofollow, nocache"}],["$","meta","7",{"name":"category","content":"automotive"}],["$","meta","8",{"property":"og:title","content":"Auto Sale Umar — автомобиль, выбранный точно"}],["$","meta","9",{"property":"og:description","content":"Премиальные автомобили в наличии и под заказ. Международный подбор и поставка автомобилей в Узбекистан и страны СНГ."}],["$","meta","10",{"property":"og:url","content":"https://autosaleumar.com/"}],["$","meta","11",{"property":"og:site_name","content":"Auto Sale Umar"}],["$","meta","12",{"property":"og:locale","content":"ru_RU"}],["$","meta","13",{"property":"og:type","content":"website"}],["$","meta","14",{"name":"twitter:card","content":"summary"}],["$","meta","15",{"name":"twitter:title","content":"Auto Sale Umar — автомобиль, выбранный точно"}],["$","meta","16",{"name":"twitter:description","content":"Премиальные автомобили в наличии и под заказ. Международный подбор и поставка автомобилей в Узбекистан и страны СНГ."}],["$","link","17",{"rel":"icon","href":"/icon.png?icon.3yd4nkfud99qa.png","sizes":"512x512","type":"image/png"}],["$","link","18",{"rel":"apple-touch-icon","href":"/apple-icon.png?apple-icon.2gfxyi220cid8.png","sizes":"180x180","type":"image/png"}],["$","$L17","19",{}]]

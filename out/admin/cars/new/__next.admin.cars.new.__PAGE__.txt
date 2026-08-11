1:"$Sreact.fragment"
2:I[47257,["/_next/static/chunks/3fntmmi971322.js"],"ClientPageRoot"]
3:I[63622,["/_next/static/chunks/3fntmmi971322.js","/_next/static/chunks/0tyu_hxb3jbxs.js","/_next/static/chunks/2m891c2u_flh9.js"],"default"]
6:I[97367,["/_next/static/chunks/3fntmmi971322.js"],"OutletBoundary"]
7:"$Sreact.suspense"
b:I[97367,["/_next/static/chunks/3fntmmi971322.js"],"ViewportBoundary"]
c:I[97367,["/_next/static/chunks/3fntmmi971322.js"],"MetadataBoundary"]
d:I[27201,["/_next/static/chunks/3fntmmi971322.js"],"IconMark"]
f:I[39756,["/_next/static/chunks/3fntmmi971322.js"],"default"]
10:I[37457,["/_next/static/chunks/3fntmmi971322.js"],"default"]
:HL["/_next/static/chunks/3ufl7gws_acfw.css","style"]
:HL["/_next/static/chunks/39e3-lo3vtiw0.css","style"]
:HL["/_next/static/chunks/1-z5e9oyj4lgl.css","style"]
a:X
12:X
12:C
15:T776,
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
0:{"buildId":"BvVLHwqjcYYeoIgycrz60","data":[{"rsc":["$","$1","c",{"children":[["$","$L2",null,{"Component":"$3","serverProvidedParams":{"searchParams":{},"params":{},"promises":["$@4","$@5"]}}],[["$","link","0",{"rel":"stylesheet","href":"/_next/static/chunks/3ufl7gws_acfw.css","precedence":"next"}],["$","link","1",{"rel":"stylesheet","href":"/_next/static/chunks/39e3-lo3vtiw0.css","precedence":"next"}],["$","script","script-0",{"src":"/_next/static/chunks/0tyu_hxb3jbxs.js","async":true}],["$","script","script-1",{"src":"/_next/static/chunks/2m891c2u_flh9.js","async":true}]],["$","$L6",null,{"children":["$","$7",null,{"name":"Next.MetadataOutlet","children":"$@8"}]}]]}],"isPartial":"$@9","staleTime":"$a","varyParams":null},{"rsc":["$","$1","h",{"children":[null,["$","$Lb",null,{"children":[["$","meta","0",{"charSet":"utf-8"}],["$","meta","1",{"name":"viewport","content":"width=device-width, initial-scale=1, viewport-fit=cover"}],["$","meta","2",{"name":"theme-color","content":"#f5f5f3"}]]}],["$","div",null,{"hidden":true,"children":["$","$Lc",null,{"children":["$","$7",null,{"name":"Next.Metadata","children":[["$","title","0",{"children":"Auto Sale Umar — премиальные автомобили и международная поставка"}],["$","meta","1",{"name":"description","content":"Auto Sale Umar — премиальный автомобильный шоурум в Ташкенте. Автомобили в наличии и под заказ, подбор и международная поставка из США, Канады, Кореи, ОАЭ, Европы и других рынков."}],["$","meta","2",{"name":"application-name","content":"Auto Sale Umar"}],["$","link","3",{"rel":"manifest","href":"/site.webmanifest"}],["$","meta","4",{"name":"creator","content":"Auto Sale Umar"}],["$","meta","5",{"name":"publisher","content":"Auto Sale Umar"}],["$","meta","6",{"name":"robots","content":"noindex, nofollow, nocache"}],["$","meta","7",{"name":"category","content":"automotive"}],["$","meta","8",{"property":"og:title","content":"Auto Sale Umar — автомобиль, выбранный точно"}],["$","meta","9",{"property":"og:description","content":"Премиальные автомобили в наличии и под заказ. Международный подбор и поставка автомобилей в Узбекистан и страны СНГ."}],["$","meta","10",{"property":"og:url","content":"https://autosaleumar.com/"}],["$","meta","11",{"property":"og:site_name","content":"Auto Sale Umar"}],["$","meta","12",{"property":"og:locale","content":"ru_RU"}],["$","meta","13",{"property":"og:type","content":"website"}],["$","meta","14",{"name":"twitter:card","content":"summary"}],["$","meta","15",{"name":"twitter:title","content":"Auto Sale Umar — автомобиль, выбранный точно"}],["$","meta","16",{"name":"twitter:description","content":"Премиальные автомобили в наличии и под заказ. Международный подбор и поставка автомобилей в Узбекистан и страны СНГ."}],["$","link","17",{"rel":"icon","href":"/icon.png?icon.3yd4nkfud99qa.png","sizes":"512x512","type":"image/png"}],["$","link","18",{"rel":"apple-touch-icon","href":"/apple-icon.png?apple-icon.2gfxyi220cid8.png","sizes":"180x180","type":"image/png"}],["$","$Ld","19",{}]]}]}]}],null]}],"isPartial":"$@e","staleTime":"$a","varyParams":null},{"rsc":["$","$1","c",{"children":[null,["$","$Lf",null,{"parallelRouterKey":"children","template":["$","$L10",null,{}]}]]}],"isPartial":"$@11","staleTime":"$a","varyParams":"$12"},{"rsc":["$","$1","c",{"children":[null,["$","$Lf",null,{"parallelRouterKey":"children","template":["$","$L10",null,{}]}]]}],"isPartial":"$@13","staleTime":"$a","varyParams":"$12"},{"rsc":["$","$1","c",{"children":[null,["$","$Lf",null,{"parallelRouterKey":"children","template":["$","$L10",null,{}]}]]}],"isPartial":"$@14","staleTime":"$a","varyParams":null},{"rsc":["$","$1","c",{"children":[[["$","link","0",{"rel":"stylesheet","href":"/_next/static/chunks/1-z5e9oyj4lgl.css","precedence":"next"}],["$","script","script-0",{"src":"/_next/static/chunks/3fntmmi971322.js","async":true}]],["$","html",null,{"lang":"ru","suppressHydrationWarning":true,"children":[["$","head",null,{"children":["$","script",null,{"dangerouslySetInnerHTML":{"__html":"$15"}}]}],"$L16"]}]]}],"isPartial":"$@17","staleTime":"$a","varyParams":null}],"isUpgradeableISRFallback":false,"a":"$@18","rootVaryParams":null,"needsRuntimeRequest":"$@19"}
4:{}
5:"$0:data:0:rsc:props:children:0:props:serverProvidedParams:params"
8:null
16:["$","body",null,{"children":["$","$Lf",null,{"parallelRouterKey":"children","template":["$","$L10",null,{}],"notFound":[[["$","title",null,{"children":"404: This page could not be found."}],["$","div",null,{"style":{"fontFamily":"system-ui,\"Segoe UI\",Roboto,Helvetica,Arial,sans-serif,\"Apple Color Emoji\",\"Segoe UI Emoji\"","height":"100vh","textAlign":"center","display":"flex","flexDirection":"column","alignItems":"center","justifyContent":"center"},"children":["$","div",null,{"children":[["$","style",null,{"dangerouslySetInnerHTML":{"__html":"body{color:#000;background:#fff;margin:0}.next-error-h1{border-right:1px solid rgba(0,0,0,.3)}@media (prefers-color-scheme:dark){body{color:#fff;background:#000}.next-error-h1{border-right:1px solid rgba(255,255,255,.3)}}"}}],["$","h1",null,{"className":"next-error-h1","style":{"display":"inline-block","margin":"0 20px 0 0","padding":"0 23px 0 0","fontSize":24,"fontWeight":500,"verticalAlign":"top","lineHeight":"49px"},"children":404}],["$","div",null,{"style":{"display":"inline-block"},"children":["$","h2",null,{"style":{"fontSize":14,"fontWeight":400,"lineHeight":"49px","margin":0},"children":"This page could not be found."}]}]]}]}]],[]]}]}]
a:300
19:true
a:C
18:0
e:"$undefined"
11:"$undefined"
13:"$undefined"
14:"$undefined"
17:"$undefined"
9:"$undefined"

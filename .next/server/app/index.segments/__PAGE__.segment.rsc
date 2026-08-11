1:"$Sreact.fragment"
2:I[61096,["/_next/static/chunks/3fntmmi971322.js","/_next/static/chunks/06dgf658wvkfz.js","/_next/static/chunks/0i1hqpx5c5hsr.js"],"default"]
3:I[97367,["/_next/static/chunks/3fntmmi971322.js"],"OutletBoundary"]
4:"$Sreact.suspense"
8:I[97367,["/_next/static/chunks/3fntmmi971322.js"],"ViewportBoundary"]
9:I[97367,["/_next/static/chunks/3fntmmi971322.js"],"MetadataBoundary"]
a:I[27201,["/_next/static/chunks/3fntmmi971322.js"],"IconMark"]
:HL["/_next/static/chunks/3dzfwt4szko9t.css","style"]
:HL["/_next/static/chunks/1-z5e9oyj4lgl.css","style"]
7:X
c:T776,
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
0:{"buildId":"BvVLHwqjcYYeoIgycrz60","data":[{"rsc":["$","$1","c",{"children":[[["$","script",null,{"type":"application/ld+json","dangerouslySetInnerHTML":{"__html":"{\"@context\":\"https://schema.org\",\"@type\":\"AutoDealer\",\"name\":\"Auto Sale Umar\",\"url\":\"https://autosaleumar.com/\",\"logo\":\"https://autosaleumar.com/brand/asu-wordmark-black.png\",\"telephone\":\"+998771155553\",\"address\":{\"@type\":\"PostalAddress\",\"addressLocality\":\"Tashkent\",\"addressCountry\":\"UZ\"},\"sameAs\":[\"https://www.instagram.com/auto_sale_umar/\",\"https://www.threads.net/@auto_sale_umar\",\"https://t.me/auto_sale_umar777\"]}"}}],["$","$L2",null,{}]],[["$","link","0",{"rel":"stylesheet","href":"/_next/static/chunks/3dzfwt4szko9t.css","precedence":"next"}],["$","script","script-0",{"src":"/_next/static/chunks/06dgf658wvkfz.js","async":true}],["$","script","script-1",{"src":"/_next/static/chunks/0i1hqpx5c5hsr.js","async":true}]],["$","$L3",null,{"children":["$","$4",null,{"name":"Next.MetadataOutlet","children":"$@5"}]}]]}],"isPartial":"$@6","staleTime":"$7","varyParams":null},{"rsc":["$","$1","h",{"children":[null,["$","$L8",null,{"children":[["$","meta","0",{"charSet":"utf-8"}],["$","meta","1",{"name":"viewport","content":"width=device-width, initial-scale=1, viewport-fit=cover"}],["$","meta","2",{"name":"theme-color","content":"#f5f5f3"}]]}],["$","div",null,{"hidden":true,"children":["$","$L9",null,{"children":["$","$4",null,{"name":"Next.Metadata","children":[["$","title","0",{"children":"Auto Sale Umar — премиальные автомобили в Ташкенте"}],["$","meta","1",{"name":"description","content":"Новые премиальные автомобили в наличии и в пути. Международный подбор и поставка из США, Канады, Кореи, ОАЭ, Европы, Великобритании и Австралии."}],["$","meta","2",{"name":"application-name","content":"Auto Sale Umar"}],["$","link","3",{"rel":"manifest","href":"/site.webmanifest"}],["$","meta","4",{"name":"creator","content":"Auto Sale Umar"}],["$","meta","5",{"name":"publisher","content":"Auto Sale Umar"}],["$","meta","6",{"name":"robots","content":"index, follow"}],["$","meta","7",{"name":"googlebot","content":"index, follow, max-video-preview:-1, max-image-preview:large, max-snippet:-1"}],["$","meta","8",{"name":"category","content":"automotive"}],["$","link","9",{"rel":"canonical","href":"https://autosaleumar.com/"}],["$","meta","10",{"property":"og:title","content":"Auto Sale Umar — автомобиль, выбранный точно"}],["$","meta","11",{"property":"og:description","content":"Премиальный автомобильный шоурум. Автомобили в наличии и в пути, международный подбор и поставка."}],["$","meta","12",{"property":"og:url","content":"https://autosaleumar.com/"}],["$","meta","13",{"name":"twitter:card","content":"summary"}],["$","meta","14",{"name":"twitter:title","content":"Auto Sale Umar — автомобиль, выбранный точно"}],["$","meta","15",{"name":"twitter:description","content":"Премиальный автомобильный шоурум. Автомобили в наличии и в пути, международный подбор и поставка."}],["$","link","16",{"rel":"icon","href":"/icon.png?icon.3yd4nkfud99qa.png","sizes":"512x512","type":"image/png"}],["$","link","17",{"rel":"apple-touch-icon","href":"/apple-icon.png?apple-icon.2gfxyi220cid8.png","sizes":"180x180","type":"image/png"}],["$","$La","18",{}]]}]}]}],null]}],"isPartial":"$@b","staleTime":"$7","varyParams":null},{"rsc":["$","$1","c",{"children":[[["$","link","0",{"rel":"stylesheet","href":"/_next/static/chunks/1-z5e9oyj4lgl.css","precedence":"next"}],["$","script","script-0",{"src":"/_next/static/chunks/3fntmmi971322.js","async":true}]],["$","html",null,{"lang":"ru","suppressHydrationWarning":true,"children":[["$","head",null,{"children":["$","script",null,{"dangerouslySetInnerHTML":{"__html":"$c"}}]}],"$Ld"]}]]}],"isPartial":"$@e","staleTime":"$7","varyParams":null}],"isUpgradeableISRFallback":false,"a":"$@f","rootVaryParams":null,"needsRuntimeRequest":"$@10"}
11:I[39756,["/_next/static/chunks/3fntmmi971322.js"],"default"]
12:I[37457,["/_next/static/chunks/3fntmmi971322.js"],"default"]
5:null
d:["$","body",null,{"children":["$","$L11",null,{"parallelRouterKey":"children","template":["$","$L12",null,{}],"notFound":[[["$","title",null,{"children":"404: This page could not be found."}],["$","div",null,{"style":{"fontFamily":"system-ui,\"Segoe UI\",Roboto,Helvetica,Arial,sans-serif,\"Apple Color Emoji\",\"Segoe UI Emoji\"","height":"100vh","textAlign":"center","display":"flex","flexDirection":"column","alignItems":"center","justifyContent":"center"},"children":["$","div",null,{"children":[["$","style",null,{"dangerouslySetInnerHTML":{"__html":"body{color:#000;background:#fff;margin:0}.next-error-h1{border-right:1px solid rgba(0,0,0,.3)}@media (prefers-color-scheme:dark){body{color:#fff;background:#000}.next-error-h1{border-right:1px solid rgba(255,255,255,.3)}}"}}],["$","h1",null,{"className":"next-error-h1","style":{"display":"inline-block","margin":"0 20px 0 0","padding":"0 23px 0 0","fontSize":24,"fontWeight":500,"verticalAlign":"top","lineHeight":"49px"},"children":404}],["$","div",null,{"style":{"display":"inline-block"},"children":["$","h2",null,{"style":{"fontSize":14,"fontWeight":400,"lineHeight":"49px","margin":0},"children":"This page could not be found."}]}]]}]}]],[]]}]}]
7:300
10:true
7:C
f:0
b:"$undefined"
e:"$undefined"
6:"$undefined"

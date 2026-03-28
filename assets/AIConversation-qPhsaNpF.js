import{r as s,j as e,aa as Q}from"./index-Bo-URo_8.js";import{c as W,a as X,g as K,b as L,f as U}from"./aiService-DePJ47Da.js";const Z=({isSpeaking:u=!1,character:a="teacher"})=>{const[c,i]=s.useState(!1);return s.useEffect(()=>{if(u)i(!0);else{const d=setTimeout(()=>i(!1),500);return()=>clearTimeout(d)}},[u]),e.jsxs("div",{className:`character-wrapper ${c?"speaking":""} character-${a}`,children:[e.jsxs("div",{className:"background-circle",children:[e.jsx("div",{className:"border-circle",id:"one"}),e.jsx("div",{className:"border-circle",id:"two"}),e.jsx("div",{className:"body"}),e.jsxs("div",{className:"head",children:[e.jsxs("div",{className:"hair-main",children:[e.jsx("div",{className:"hair-top"}),e.jsx("div",{className:"hair-bottom"})]}),e.jsx("div",{className:"sideburn",id:"left"}),e.jsx("div",{className:"sideburn",id:"right"}),e.jsx("div",{className:"face"}),e.jsx("div",{className:"ear",id:"left"}),e.jsx("div",{className:"ear",id:"right"}),e.jsxs("div",{className:"eye-shadow",id:"left",children:[e.jsx("div",{className:"eyebrow"}),e.jsx("div",{className:"eye"})]}),e.jsxs("div",{className:"eye-shadow",id:"right",children:[e.jsx("div",{className:"eyebrow"}),e.jsx("div",{className:"eye"})]}),e.jsx("div",{className:"nose"}),e.jsx("div",{className:"mouth"})]}),e.jsx("div",{className:"triangle-light"}),e.jsx("div",{className:"triangle-dark"})]}),e.jsx("div",{className:"music-note",id:"one",children:"♪"}),e.jsx("div",{className:"music-note",id:"two",children:"♫"})]})},se=()=>{const[u]=Q(),[a,c]=s.useState(null),[i,d]=s.useState(null);s.useEffect(()=>{const n=u.get("lang");(n==="japanese"||n==="chinese")&&c(n)},[u]);const[o,h]=s.useState([]),[p,b]=s.useState(""),[x,B]=s.useState(!1),[_,$]=s.useState(!1),[O,C]=s.useState({}),[H,S]=s.useState(!1),[q,Y]=s.useState(null),[m,T]=s.useState(null),P=s.useRef(null),A=a==="japanese"?[{id:"restaurant",title:"Nhà hàng",description:"Luyện giao tiếp khi đi ăn nhà hàng",level:"N5-N4",icon:"🍜",systemPrompt:`Bạn là nhân viên nhà hàng Nhật. QUAN TRỌNG:
- Trả lời bằng tiếng Nhật N5-N4
- Format BẮT BUỘC:
[JP] [Câu tiếng Nhật]
[VI] [Dịch tiếng Việt]
[OP]
1. [Gợi ý tiếng Nhật 1] (Dịch)
2. [Gợi ý tiếng Nhật 2] (Dịch)
3. [Gợi ý tiếng Nhật 3] (Dịch)

Ví dụ:
[JP] いらっしゃいませ！何名様ですか？
[VI] Xin chào! Quý khách đi mấy người ạ?
[OP]
1. ひとりです (Tôi đi một mình)
2. 二人です (Tôi đi 2 người)
3. 予約しています (Tôi đã đặt bàn)`,animatedCharacter:"waiter"},{id:"shopping",title:"Mua sắm",description:"Hỏi giá, thử đồ, thanh toán",level:"N5-N4",icon:"🛍️",systemPrompt:`Bạn là nhân viên cửa hàng. Format BẮT BUỘC:
[JP] [Câu tiếng Nhật]
[VI] [Dịch tiếng Việt]
[OP]
1. [Gợi ý 1] (Dịch)
2. [Gợi ý 2] (Dịch)
3. [Gợi ý 3] (Dịch)`,animatedCharacter:"shopkeeper"},{id:"hotel",title:"Khách sạn",description:"Check-in, yêu cầu dịch vụ",level:"N4-N3",icon:"🏨",systemPrompt:`Bạn là lễ tân khách sạn. Format BẮT BUỘC:
[JP] [Câu tiếng Nhật]
[VI] [Dịch tiếng Việt]
[OP]
1. [Gợi ý 1] (Dịch)
2. [Gợi ý 2] (Dịch)
3. [Gợi ý 3] (Dịch)`,animatedCharacter:"waiter"},{id:"friend",title:"Bạn bè",description:"Trò chuyện thân mật với bạn",level:"N5-N3",icon:"👥",systemPrompt:`Bạn là bạn thân người Nhật. Format BẮT BUỘC:
[JP] [Câu tiếng Nhật]
[VI] [Dịch tiếng Việt]
[OP]
1. [Gợi ý 1] (Dịch)
2. [Gợi ý 2] (Dịch)
3. [Gợi ý 3] (Dịch)`,animatedCharacter:"friend"},{id:"interview",title:"Phỏng vấn",description:"Phỏng vấn xin việc",level:"N3-N2",icon:"💼",systemPrompt:`Bạn là nhà tuyển dụng. Format BẮT BUỘC:
[JP] [Câu tiếng Nhật]
[VI] [Dịch tiếng Việt]
[OP]
1. [Gợi ý 1] (Dịch)
2. [Gợi ý 2] (Dịch)
3. [Gợi ý 3] (Dịch)`,animatedCharacter:"shopkeeper"}]:[{id:"restaurant_cn",title:"Nhà hàng (餐厅)",description:"Gọi món và giao tiếp tại nhà hàng Trung Quốc",level:"HSK1-2",icon:"🥟",systemPrompt:`Bạn là phục vụ bàn tại Trung Quốc. QUAN TRỌNG:
- Trả lời bằng tiếng Trung HSK 1-2
- Format BẮT BUỘC:
[ZH] [Câu tiếng Trung]
[VI] [Dịch tiếng Việt]
[OP]
1. [Gợi ý tiếng Trung 1] (Dịch)
2. [Gợi ý tiếng Trung 2] (Dịch)
3. [Gợi ý tiếng Trung 3] (Dịch)`,animatedCharacter:"waiter"},{id:"shopping_cn",title:"Mua sắm (购物)",description:"Hỏi giá và mặc cả tại chợ/cửa hàng",level:"HSK2-3",icon:"💰",systemPrompt:`Bạn là người bán hàng Trung Quốc. Trả lời ngắn gọn. Format BẮT BUỘC:
[ZH] [Câu tiếng Trung]
[VI] [Dịch tiếng Việt]
[OP]
1. [Gợi ý 1] (Dịch)
2. [Gợi ý 2] (Dịch)
3. [Gợi ý 3] (Dịch)`,animatedCharacter:"shopkeeper"},{id:"travel_cn",title:"Du lịch (旅游)",description:"Hỏi đường, đi taxi, tham quan",level:"HSK2-3",icon:"🏮",systemPrompt:`Bạn là người dân địa phương nhiệt tình. Format BẮT BUỘC:
[ZH] [Câu tiếng Trung]
[VI] [Dịch tiếng Việt]
[OP]
1. [Gợi ý 1] (Dịch)
2. [Gợi ý 2] (Dịch)
3. [Gợi ý 3] (Dịch)`,animatedCharacter:"friend"},{id:"friend_cn",title:"Bạn bè (朋友)",description:"Luyện nói chuyện phiếm với bạn bè",level:"HSK1-3",icon:"🧋",systemPrompt:`Bạn là bạn người Trung Quốc. Dùng ngôn ngữ tự nhiên. Format BẮT BUỘC:
[ZH] [Câu tiếng Trung]
[VI] [Dịch tiếng Việt]
[OP]
1. [Gợi ý 1] (Dịch)
2. [Gợi ý 2] (Dịch)
3. [Gợi ý 3] (Dịch)`,animatedCharacter:"friend"}];s.useEffect(()=>{const n=localStorage.getItem("ai-conversation-chat");if(n)try{const t=JSON.parse(n);t.messages&&(t.messages=t.messages.map(r=>({...r,timestamp:new Date(r.timestamp)}))),T(t),S(!0)}catch(t){console.error("Error loading saved conversation:",t),localStorage.removeItem("ai-conversation-chat")}},[]),s.useEffect(()=>{if(i&&o.length>0){const n={scenario:i,messages:o,timestamp:Date.now()};localStorage.setItem("ai-conversation-chat",JSON.stringify(n))}},[i,o]),s.useEffect(()=>{I()},[o]);const I=()=>{var n;(n=P.current)==null||n.scrollIntoView({behavior:"smooth"})},J=()=>{if(m){d(m.scenario),m.scenario.id.endsWith("_cn")?c("chinese"):c("japanese");const n=m.messages.map(t=>({...t,timestamp:t.timestamp instanceof Date?t.timestamp:new Date(t.timestamp)}));h(n),S(!1),setTimeout(I,100)}},M=()=>{localStorage.removeItem("ai-conversation-chat"),T(null),S(!1),h([]),d(null),c(null),C({})},R=()=>{localStorage.removeItem("ai-conversation-chat"),h([]),d(null),c(null),T(null),C({})},F=n=>{d(n);const t={restaurant:`[JP] いらっしゃいませ！何名様ですか？
[VI] Xin chào! Quý khách đi mấy người ạ?
[OP]
1. ひとりです (Tôi đi một mình)
2. 二人です (Tôi đi 2 người)
3. 予約しています (Tôi đã đặt bàn)`,shopping:`[JP] いらっしゃいませ！何かお探しですか？
[VI] Xin chào! Quý khách đang tìm gì ạ?
[OP]
1. 見ているだけです (Tôi chỉ xem thôi)
2. Tシャツを探しています (Tôi tìm áo phông)
3. 試着してもいいですか (Tôi thử đồ được không)`,hotel:`[JP] いらっしゃいませ。チェックインでしょうか？
[VI] Xin chào. Quý khách check-in phải không ạ?
[OP]
1. はい、チェックインお願いします (Vâng, cho tôi check-in)
2. 予約しています (Tôi đã đặt phòng)
3. 荷物を預かってもらえますか (Giữ hành lý giúp tôi được không)`,friend:`[JP] やあ！元気？
[VI] Chào! Khỏe không?
[OP]
1. 元気だよ (Khỏe)
2. まあまあかな (Bình thường)
3. 忙しいよ (Bận lắm)`,interview:`[JP] こんにちは。自己紹介をお願いします。
[VI] Xin chào. Hãy tự giới thiệu bản thân.
[OP]
1. はじめまして、〜と申します (Xin chào, tôi tên là...)
2. よろしくお願いします (Rất mong được giúp đỡ)
3. 経験について話します (Tôi sẽ nói về kinh nghiệm)`,restaurant_cn:`[ZH] 您好！请问几位？
[VI] Xin chào! Quý khách đi mấy người ạ?
[OP]
1. 一个人 (Một người)
2. 两位 (Hai người)
3. 我有订位 (Tôi đã đặt bàn)`,shopping_cn:`[ZH] 您好！想买什么？
[VI] Xin chào! Bạn muốn mua gì?
[OP]
1. 我先看看 (Tôi xem trước đã)
2. 这个多少钱？ (Cái này bao nhiêu tiền?)
3. 有大一点的吗？ (Có cái nào to hơn không?)`,travel_cn:`[ZH] 你好！要去哪里？
[VI] Chào bạn! Bạn muốn đi đâu?
[OP]
1. 我要去故宫 (Tôi muốn đi Cố Cung)
2. 这里怎么走？ (Chỗ này đi thế nào?)
3. 多少钱？ (Bao nhiêu tiền?)`,friend_cn:`[ZH] 嗨！最近怎么样？
[VI] Hi! Dạo này thế nào?
[OP]
1. 挺好的 (Rất tốt)
2. 还可以 (Cũng bình thường)
3. 挺忙的 (Khá là bận)`};h([{id:Date.now().toString(),role:"assistant",content:t[n.id]||(a==="japanese"?`[JP] こんにちは！
[VI] Xin chào!`:`[ZH] 你好！
[VI] Xin chào!`),timestamp:new Date}])},k=async()=>{if(!p.trim()||!i)return;const n={id:Date.now().toString(),role:"user",content:p,timestamp:new Date};h(r=>[...r,n]);const t=p;b(""),B(!0);try{const l="AIzaSyDcuSb0T66JoMBp33rRtePzh5bgYqER688",y="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";let f="";if(l||y){const j=W(o.map(N=>({role:N.role,content:N.content})),i.title,a||void 0),E=o.slice(-8),V=[X(i.systemPrompt,a||void 0,j),...E.map(N=>({role:N.role,content:N.content})),{role:"user",content:t}],D=await K(V,a||void 0);D.error?(console.error("AI Error:",D.error),f=L(t,i.id,V)):f=U(D.content,a||void 0)}h(j=>[...j,{id:(Date.now()+1).toString(),role:"assistant",content:f,timestamp:new Date}])}catch(r){console.error("Error:",r)}finally{B(!1)}},w=n=>{C(t=>({...t,[n]:!t[n]}))},z=n=>{const t=n.match(/\[(JP|ZH)\]([\s\S]*?)(?=\[VI\]|$)/),r=n.match(/\[VI\]([\s\S]*?)(?=\[OP\]|\[FIX\]|$)/),l=n.match(/\[OP\]([\s\S]*?)(?=\[FIX\]|$)/),g=n.match(/\[FIX\]([\s\S]*)/);return{jp:t?t[2].trim():n,vi:r?r[1].trim():"",op:l?l[1].trim().split(`
`).filter(v=>v.trim()):[],fix:g?g[1].trim():""}};return H&&m?e.jsx("div",{className:"container",children:e.jsxs("div",{className:"card",style:{maxWidth:"500px",margin:"2rem auto",padding:"2rem",textAlign:"center"},children:[e.jsx("h2",{style:{marginBottom:"1rem",color:"var(--text-primary)"},children:"💬 Tiếp tục cuộc trò chuyện?"}),e.jsxs("p",{style:{marginBottom:"2rem",color:"var(--text-secondary)"},children:['Bạn có một cuộc trò chuyện đang dở với tình huống "',m.scenario.title,'".']}),e.jsxs("div",{style:{display:"flex",gap:"1rem",justifyContent:"center"},children:[e.jsx("button",{onClick:J,className:"btn btn-primary",children:"Tiếp tục"}),e.jsx("button",{onClick:M,className:"btn btn-outline",children:"Bắt đầu mới"})]})]})}):a?i?e.jsxs("div",{className:"container",style:{maxWidth:"1200px"},children:[e.jsxs("div",{style:{display:"flex",alignItems:"center",gap:"1rem",marginBottom:"2rem"},children:[e.jsxs("button",{className:"btn btn-outline",onClick:R,children:[e.jsx("svg",{style:{width:"20px",height:"20px"},viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"1.5",children:e.jsx("path",{d:"M15 19l-7-7 7-7"})}),"Quay lại"]}),e.jsxs("div",{style:{flex:1,textAlign:"center"},children:[e.jsxs("h2",{style:{fontSize:"2.5rem",fontWeight:"900",marginBottom:"0.5rem",background:(()=>{switch(i.id){case"restaurant":return"linear-gradient(135deg, #f97316 0%, #ea580c 100%)";case"shopping":return"linear-gradient(135deg, #ec4899 0%, #be185d 100%)";case"hotel":return"linear-gradient(135deg, #eab308 0%, #ca8a04 100%)";case"friend":return"linear-gradient(135deg, #22c55e 0%, #15803d 100%)";case"interview":return"linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)";case"doctor":return"linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)";default:return"linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)"}})(),WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",display:"inline-block"},children:[i.icon," ",i.title]}),e.jsx("p",{style:{color:"var(--text-secondary)",fontSize:"1.1rem",fontWeight:"500"},children:i.description})]})]}),e.jsxs("div",{className:"conversation-grid",children:[e.jsxs("div",{className:"character-frame-css",style:{borderColor:(()=>{switch(i.id){case"restaurant":return"#f97316";case"shopping":return"#ec4899";case"hotel":return"#eab308";case"friend":return"#22c55e";case"interview":return"#3b82f6";case"doctor":return"#06b6d4";default:return"var(--primary-color)"}})()},children:[e.jsxs("div",{className:"frame-header-css",children:[e.jsx("span",{className:"status-dot-css"}),i.title]}),e.jsxs("div",{className:"character-stage-css",children:[e.jsx(Z,{isSpeaking:x,character:i.animatedCharacter}),x&&e.jsx("div",{className:"thought-bubble-css",children:"💭"})]})]}),e.jsxs("div",{className:"chat-frame-css",children:[e.jsxs("div",{className:"messages-list-css",children:[o.map(n=>{const t=n.role==="assistant",{jp:r,vi:l,op:g,fix:v}=t?z(n.content):{jp:n.content,vi:"",op:[],fix:""},G=O[n.id];return e.jsxs("div",{style:{display:"flex",flexDirection:"column",alignItems:t?"flex-start":"flex-end",marginBottom:"1rem"},children:[e.jsxs("div",{className:`message-css ${t?"ai":"user"}`,children:[e.jsx("div",{style:{whiteSpace:"pre-line"},children:r}),t&&v&&e.jsxs("div",{style:{marginTop:"0.75rem",padding:"0.5rem 0.75rem",background:"rgba(255, 255, 255, 0.2)",borderRadius:"8px",fontSize:"0.8rem",borderLeft:"3px solid #fbbf24",color:"rgba(255, 255, 255, 0.95)"},children:[e.jsx("strong",{children:"📝 Góp ý:"})," ",v]})]}),t&&e.jsx("div",{style:{marginTop:"0.25rem",width:"100%",maxWidth:"90%"},children:G?e.jsxs("div",{style:{marginTop:"0.5rem",background:"var(--bg-secondary)",borderRadius:"12px",padding:"1rem",border:"1px solid var(--border-color)",animation:"fadeIn 0.3s ease"},children:[l&&e.jsxs("div",{style:{marginBottom:"0.75rem",paddingBottom:"0.5rem",borderBottom:"1px solid var(--border-color)",color:"var(--text-secondary)",fontStyle:"italic",fontSize:"0.9rem"},children:["🇻🇳 ",l]}),g.length>0&&e.jsxs("div",{className:"options-list-css",style:{border:"none",padding:0},children:[e.jsx("p",{style:{fontSize:"0.85rem",marginBottom:"0.5rem"},children:"Gợi ý trả lời:"}),g.slice(0,3).map((y,f)=>{const j=y.replace(/^\d+\.\s*/,"").split("(")[0].trim();return e.jsx("button",{className:"option-css",onClick:()=>b(j),style:{padding:"0.5rem 0.75rem",fontSize:"0.9rem",marginBottom:"0.25rem"},children:y},f)})]}),e.jsx("button",{onClick:()=>w(n.id),style:{fontSize:"0.75rem",color:"var(--text-secondary)",background:"none",border:"none",cursor:"pointer",marginTop:"0.5rem",width:"100%",textAlign:"center"},children:"Thu gọn 🔼"})]}):e.jsx("button",{onClick:()=>w(n.id),style:{background:"none",border:"none",color:"var(--primary-color)",cursor:"pointer",fontSize:"0.85rem",display:"flex",alignItems:"center",gap:"0.25rem",fontWeight:"600",padding:"0.25rem"},children:"💡 Gợi ý & Dịch"})})]},n.id)}),e.jsx("div",{ref:P})]}),e.jsxs("div",{style:{marginTop:"1rem",display:"flex",gap:"0.5rem"},children:[e.jsx("input",{type:"text",value:p,onChange:n=>b(n.target.value),onKeyDown:n=>n.key==="Enter"&&k(),placeholder:"Nhập tin nhắn...",className:"option-css",style:{flex:1,cursor:"text",margin:0},disabled:x}),e.jsx("button",{className:"btn btn-primary",onClick:k,disabled:x||!p.trim(),style:{borderRadius:"12px",padding:"0 1.5rem"},children:x?"...":"Gửi"})]})]})]})]}):e.jsxs("div",{className:"container","data-language":a,children:[e.jsxs("div",{className:"header",children:[e.jsxs("div",{style:{display:"flex",alignItems:"center",justifyContent:"center",gap:"1rem",marginBottom:"1.5rem"},children:[e.jsx("button",{className:"btn btn-outline",onClick:()=>c(null),style:{padding:"0.5rem 1rem"},children:"Thay đổi ngôn ngữ"}),e.jsx("span",{style:{fontSize:"2rem"},children:a==="japanese"?"🇯🇵":"🇨🇳"})]}),e.jsx("h1",{children:e.jsx("span",{className:"title-highlight",children:"Nhập vai cùng AI"})}),e.jsxs("p",{children:["Luyện giao tiếp ",a==="japanese"?"tiếng Nhật":"tiếng Trung"," trong các tình huống thực tế"]})]}),e.jsx("div",{className:"card-grid",children:A.map(n=>e.jsxs("div",{className:"card",style:{cursor:"pointer"},onClick:()=>F(n),children:[e.jsx("div",{style:{fontSize:"3rem",marginBottom:"1rem"},children:n.icon}),e.jsx("h3",{style:{fontSize:"1.25rem",fontWeight:"700",marginBottom:"0.5rem"},children:n.title}),e.jsx("p",{style:{color:"var(--text-secondary)",fontSize:"0.9375rem",marginBottom:"0.75rem"},children:n.description}),e.jsx("span",{className:`badge badge-${n.level.toLowerCase().replace("-","")}`,children:n.level})]},n.id))})]}):e.jsxs("div",{className:"container","data-language":"both",children:[e.jsxs("div",{className:"header",children:[e.jsx("h1",{children:e.jsx("span",{className:"title-highlight",children:"Nhập vai cùng AI"})}),e.jsx("p",{children:"Chọn ngôn ngữ bạn muốn luyện tập giao tiếp"})]}),e.jsxs("div",{style:{display:"flex",gap:"2rem",justifyContent:"center",maxWidth:"1000px",margin:"3rem auto",flexWrap:"wrap"},children:[e.jsxs("div",{className:"lang-card-premium jp-style",onClick:()=>c("japanese"),children:[e.jsx("div",{className:"lang-box",children:"JP"}),e.jsxs("div",{className:"lang-info",children:[e.jsx("span",{className:"lang-name",children:"Tiếng Nhật"}),e.jsx("span",{className:"lang-native",children:"日本語"}),e.jsx("span",{className:"lang-desc",children:"Luyện tập giao tiếp JLPT N5-N2"})]}),e.jsx("div",{className:"lang-indicator"})]}),e.jsxs("div",{className:"lang-card-premium cn-style",onClick:()=>c("chinese"),children:[e.jsx("div",{className:"lang-box",children:"CN"}),e.jsxs("div",{className:"lang-info",children:[e.jsx("span",{className:"lang-name",children:"Tiếng Trung"}),e.jsx("span",{className:"lang-native",children:"中文"}),e.jsx("span",{className:"lang-desc",children:"Luyện tập giao tiếp HSK 1-6"})]}),e.jsx("div",{className:"lang-indicator"})]})]})]})};export{se as default};

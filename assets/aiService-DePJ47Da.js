async function N(t){return{content:"",error:"OpenAI API key not configured. Please add VITE_OPENAI_API_KEY to your .env file."}}async function k(t){return{content:"",error:`Chưa cấu hình DeepSeek API key. Vui lòng thêm VITE_DEEPSEEK_API_KEY vào file .env.local

Hướng dẫn: Vào https://platform.deepseek.com/api_keys để lấy key miễn phí.`}}async function T(t){return{content:"",error:`Chưa cấu hình Hugging Face API key. Vui lòng thêm VITE_HUGGINGFACE_API_KEY vào file .env.local

Hướng dẫn: Vào https://huggingface.co/settings/tokens để lấy token miễn phí.`}}async function C(t){return{content:"",error:`Chưa cấu hình Qwen API key. Vui lòng thêm VITE_QWEN_API_KEY vào file .env.local

Hướng dẫn: Vào https://dashscope.aliyun.com/ để lấy key miễn phí.`}}async function P(t,c){var i,e,n,g,l,s;const o="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";try{const u=await fetch("https://openrouter.ai/api/v1/chat/completions",{method:"POST",headers:{"Content-Type":"application/json",Authorization:`Bearer ${o}`,"HTTP-Referer":window.location.origin,"X-Title":"Japanese Learning App"},body:JSON.stringify({model:c?"qwen/qwen-2.5-vl-7b-instruct:free":"qwen/qwen-2.5-7b-instruct",messages:[t.find(a=>a.role==="system")||{role:"system",content:"You are a helpful assistant."},...t.filter(a=>a.role!=="system").slice(-10)].map((a,p,h)=>c&&p===h.length-1&&a.role==="user"?{role:"user",content:[{type:"text",text:a.content},{type:"image_url",image_url:{url:c.startsWith("data:")?c:`data:image/png;base64,${c}`}}]}:a),temperature:.7,max_tokens:800,top_p:.9,stream:!1})});if(!u.ok){const a=await u.text();console.error("OpenRouter API Error Response:",a);let p;try{p=JSON.parse(a)}catch{throw new Error(`API Error: ${u.status} - ${a}`)}const h=((i=p.error)==null?void 0:i.message)||"OpenRouter API error";throw h.includes("Invalid API key")||h.includes("authentication")?new Error("API key không hợp lệ. Vui lòng tạo key mới tại: https://openrouter.ai/keys"):h.includes("quota")||h.includes("limit")||h.includes("credits")?new Error("Đã vượt quá hạn mức sử dụng. Vui lòng đợi hoặc nạp thêm credits."):new Error(h)}const m=await u.json(),I=((g=(n=(e=m.choices)==null?void 0:e[0])==null?void 0:n.message)==null?void 0:g.content)||"";if(!I){const a=t.some(r=>r.content.includes("[ZH]")),p=(s=(l=m.choices)==null?void 0:l[0])==null?void 0:s.finish_reason;let h="";return a?h=p==="content_filter"?`对不起，请用更简单的词语说话。
(Xin lỗi, hãy nói bằng từ ngữ đơn giản hơn.)`:`你好！很高兴见到你。
(Xin chào! Rất vui được gặp bạn.)`:h=p==="content_filter"?`すみません、もう少し簡単な言葉で話してください。
(Xin lỗi, hãy nói bằng từ ngữ đơn giản hơn.)`:`こんにちは！どうぞよろしくお願いします。
(Xin chào! Rất vui được gặp bạn.)`,{content:h,error:void 0}}return{content:I}}catch(u){return console.error("OpenRouter Error:",u),{content:"",error:u.message||"Không thể kết nối với OpenRouter AI"}}}async function H(t){return{content:"",error:`Chưa cấu hình Cloudflare Workers AI.

Cách 1 (Khuyến nghị): Deploy Worker proxy
- Xem hướng dẫn: cloudflare-worker/README.md
- Thêm VITE_CLOUDFLARE_WORKER_URL vào .env.local

Cách 2: Dùng trực tiếp API (có thể bị CORS)
- Thêm VITE_CLOUDFLARE_ACCOUNT_ID và VITE_CLOUDFLARE_API_TOKEN`}}async function f(t,c){var i,e,n,g,l,s;const o="AIzaSyDcuSb0T66JoMBp33rRtePzh5bgYqER688";try{const u=t.find(r=>r.role==="system"),m=t[t.length-1],I=[{role:"user",parts:[...c?[{inline_data:{mime_type:"image/png",data:c.split(",")[1]||c}}]:[],{text:m.content}]}],a=await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${o}`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({contents:I,generationConfig:{temperature:.4,maxOutputTokens:500},systemInstruction:u?{parts:[{text:u.content}]}:void 0})});if(!a.ok){const r=await a.text();console.error("Gemini API Error Response:",r);let d;try{d=JSON.parse(r)}catch{throw new Error(`API Error: ${a.status} - ${r}`)}const y=((i=d.error)==null?void 0:i.message)||"Gemini API error";throw y.includes("API key not valid")?new Error("API key không hợp lệ. Vui lòng tạo key mới tại: https://aistudio.google.com/app/apikey"):new Error(y)}const p=await a.json();console.log(" Gemini API Response:",JSON.stringify(p,null,2));let h="";try{const r=Array.isArray(p.candidates)&&p.candidates.length>0?p.candidates[0]:null;console.log("📝 Candidate:",r),r&&((e=r.content)!=null&&e.parts&&Array.isArray(r.content.parts)?h=r.content.parts.map(d=>d.text||"").join(`
`).trim():Array.isArray(r.parts)?h=r.parts.map(d=>d.text||"").join(`
`).trim():typeof(r.output_text||r.text)=="string"&&(h=(r.output_text||r.text).trim()))}catch(r){console.warn("Could not parse Gemini response content:",r)}return h?{content:h}:(((n=p.promptFeedback)==null?void 0:n.blockReason)||((l=(g=p.candidates)==null?void 0:g[0])==null?void 0:l.finishReason)||"")==="SAFETY"||(s=p.promptFeedback)!=null&&s.blockReason?{content:t.some(y=>y.content.includes("[ZH]"))?`对不起。请再用更简单的词语说话。
(Xin lỗi. Hãy thử nói lại bằng từ ngữ đơn giản hơn.)`:`申し訳ございません。もう一度、簡単な言葉で話してください。
(Xin lỗi. Hãy thử nói lại bằng từ ngữ đơn giản hơn.)`,error:void 0}:{content:t.some(y=>y.content.includes("[ZH]"))?`对不起，请再说一遍。
(Xin lỗi, bạn có thể nói lại được không?)`:`すみません、もう一度お願いします。
(Xin lỗi, bạn có thể nói lại được không?)`,error:void 0}}catch(u){return console.error("Gemini Error:",u),{content:"",error:u.message||"Không thể kết nối với Gemini AI"}}}async function A(t,c,o,i="japanese",e){var l;const n=`You are a professional ${i==="chinese"?"Chinese":"Japanese"} teacher. 
Evaluate the student's performance.
Type: ${t}
Expected character/word: ${c}
The user has drawn the character on a canvas (see image).

Return JSON format ONLY:
{
  "score": (0-100),
  "feedback": "Concise feedback in Vietnamese about accuracy",
  "tips": "Brief advice in Vietnamese to improve"
}`,g=await V([{role:"system",content:n},{role:"user",content:"Evaluate the provided input."}],i,"gemini",e);if(g.error)return{score:0,feedback:"Không thể kết nối với AI để đánh giá.",tips:""};try{const s=((l=g.content.match(/\{[\s\S]*\}/))==null?void 0:l[0])||g.content,u=JSON.parse(s);return{score:u.score||0,feedback:u.feedback||"Không có nhận xét.",tips:u.tips||""}}catch(s){return console.error("Error parsing AI evaluation:",s),{score:70,feedback:g.content,tips:""}}}async function V(t,c,o,i){const e=o||"openrouter";let n;return e==="gemini"?n=await f(t,i):e==="cloudflare"?(n=await H(),n.error&&(n=await f(t,i))):e==="openrouter"?(n=await P(t,i),n.error&&(n=await f(t,i))):e==="qwen"?(n=await C(),n.error&&(n=await f(t,i))):e==="deepseek"?(n=await k(),n.error&&(n.error.includes("Insufficient Balance")||n.error.includes("Balance"))&&(n=await f(t,i))):e==="huggingface"?n=await T():n=await N(),n}function v(t,c,o){const i=c==="chinese",e=i?"ZH":"JP",n=i?"Tiếng Trung":"Tiếng Nhật";return{role:"system",content:`${t}

${o?`[CONTEXT HIỆN TẠI]
${o}
`:""}

═══════════════════════════════════════════════════════════
⚠️ QUY TẮC BẮT BUỘC - ĐỌC KỸ VÀ TUÂN THỦ 100% ⚠️
═══════════════════════════════════════════════════════════

1️⃣ **TUYỆT ĐỐI KHÔNG LẶP LẠI CÂU CỦA NGƯỜI DÙNG**
   - Chỉ trả lời theo vai diễn của bạn
   - KHÔNG bao giờ copy hoặc nhắc lại những gì người dùng vừa nói
   
2️⃣ **LUÔN TRẢ LỜI BẰNG ${n.toUpperCase()}**
   - Ngôn ngữ chính: ${n} (tag [${e}])
   - KHÔNG ĐƯỢC dùng ngôn ngữ khác (${i?"KHÔNG dùng tiếng Nhật":"KHÔNG dùng tiếng Trung"})
   
3️⃣ **LUÔN CÓ BẢN DỊCH TIẾNG VIỆT**
   - SAU MỖI câu ${n} phải có dịch trong tag [VI]
   - Nếu thiếu [VI] = SAI FORMAT

4️⃣ **GỢI Ý [OP] PHẢI LÀ CÂU TRẢ LỜI CHO NGƯỜI DÙNG (KHÁCH HÀNG)**
   - [OP] là 3 gợi ý để **NGƯỜI DÙNG** có thể nói tiếp
   - Bạn đang đóng vai nhân viên → [OP] phải là câu của KHÁCH HÀNG
   - KHÔNG được gợi ý câu của nhân viên trong [OP]
   - Mỗi gợi ý: số thứ tự + câu ${n} + (dịch tiếng Việt)

═══════════════════════════════════════════════════════════
📋 ĐỊNH DẠNG OUTPUT - BẮT BUỘC THEO ĐÚNG
═══════════════════════════════════════════════════════════

[${e}] <Câu trả lời của bạn (VAI NHÂN VIÊN) bằng ${n}>
[VI] <Dịch tiếng Việt của câu trên>
[OP] (GỢI Ý CHO NGƯỜI DÙNG = KHÁCH HÀNG)
1. <Câu mà KHÁCH HÀNG có thể nói> (Dịch tiếng Việt)
2. <Câu mà KHÁCH HÀNG có thể nói> (Dịch tiếng Việt)
3. <Câu mà KHÁCH HÀNG có thể nói> (Dịch tiếng Việt)

═══════════════════════════════════════════════════════════
✅ VÍ DỤ ĐÚNG (HỌC THEO NÀY)
═══════════════════════════════════════════════════════════

${i?`
📌 Ví dụ 1 - Nhà hàng:
Người dùng: "我想吃面条"
✅ BẠN TRẢ LỜI:
[ZH] 好的，您想要什么口味的面条？我们有牛肉面和鸡肉面。
[VI] Vâng, bạn muốn mì vị gì? Chúng tôi có mì bò và mì gà.
[OP]
1. 牛肉面 (Mì bò)
2. 鸡肉面 (Mì gà)
3. 有辣的吗？ (Có cay không?)

📌 Ví dụ 2 - Mua sắm:
Người dùng: "这个多少钱？"
✅ BẠN TRẢ LỜI:
[ZH] 这个是两百块。您需要试一下吗？
[VI] Cái này hai trăm tệ. Bạn cần thử không?
[OP]
1. 可以便宜一点吗？ (Có thể rẻ hơn không?)
2. 我要这个 (Tôi lấy cái này)
3. 有别的颜色吗？ (Có màu khác không?)
`:`
📌 Ví dụ 1 - Nhà hàng:
Người dùng: "ラーメンを食べたいです"
✅ BẠN TRẢ LỜI:
[JP] かしこまりました。豚骨ラーメンと醤油ラーメンがございます。
[VI] Vâng ạ. Chúng tôi có ramen tonkotsu và ramen shouyu.
[OP]
1. 豚骨ラーメンをください (Cho tôi ramen tonkotsu)
2. 醤油ラーメンをお願いします (Cho tôi ramen shouyu)
3. おすすめは何ですか？ (Món nào được đề xuất?)

📌 Ví dụ 2 - Mua sắm:
Người dùng: "これはいくらですか？"
✅ BẠN TRẢ LỜI:
[JP] こちらは三千円になります。試着されますか？
[VI] Cái này 3000 yên ạ. Bạn có muốn thử không?
[OP]
1. 試着してもいいですか？ (Tôi thử được không?)
2. これをください (Lấy cái này cho tôi)
3. 他の色はありますか？ (Có màu khác không?)
`}

═══════════════════════════════════════════════════════════
❌ LỖI THƯỜNG GẶP - TRÁNH HOÀN TOÀN
═══════════════════════════════════════════════════════════

❌ SAI 1: Lặp lại câu người dùng
❌ SAI 2: Thiếu tag [VI] hoặc [OP]
❌ SAI 3: Dùng ${i?"tiếng Nhật":"tiếng Trung"} thay vì ${n}
❌ SAI 4: Chỉ có 1-2 gợi ý thay vì 3
❌ SAI 5: Response quá dài, lan man
❌ SAI 6: [OP] chứa câu của NHÂN VIÊN thay vì câu của KHÁCH HÀNG
   → VD SAI: "您要点什么?" (Quý khách muốn gọi gì?) ← Đây là câu nhân viên!
   → VD ĐÚNG: "我要这个" (Tôi lấy cái này) ← Đây là câu khách hàng!

═══════════════════════════════════════════════════════════

Bây giờ hãy đóng vai và trả lời theo FORMAT trên. Nhớ: NGẮN GỌN, TỰ NHIÊN, ĐÚNG FORMAT!`}}function O(t,c){const o=c==="chinese",i=o?"ZH":"JP";let e=t.replace(/<think>[\s\S]*?<\/think>/gi,"").replace(/<think[\s\S]*?>/gi,"").replace(/<\/think>/gi,"").trim();const n=e.includes(`[${i}]`),g=e.includes("[VI]"),l=e.includes("[OP]");if(!n&&!g&&!l)return o?`[ZH] ${e}
[VI] (Đang cập nhật bản dịch)
[OP]
1. 好的 (Vâng)
2. 谢谢 (Cảm ơn)
3. 请继续 (Xin tiếp tục)`:`[JP] ${e}
[VI] (Đang cập nhật bản dịch)
[OP]
1. はい (Vâng)
2. ありがとうございます (Cảm ơn)
3. 続けてください (Xin tiếp tục)`;if(!n){const s=o?"[JP]":"[ZH]";if(e.includes(s))return o?`[ZH] 对不起，请再说一遍。
[VI] Xin lỗi, bạn có thể nói lại không?
[OP]
1. 好的 (Vâng)
2. 没问题 (Không vấn đề gì)
3. 请继续 (Xin hãy tiếp tục)`:`[JP] すみません、もう一度お願いします。
[VI] Xin lỗi, bạn có thể nói lại không?
[OP]
1. はい (Vâng)
2. わかりました (Tôi hiểu rồi)
3. 続けてください (Xin hãy tiếp tục)`;e=`[${i}] ${e}`}if(!g){const s=e.match(/\[OP\]/);s&&s.index!==void 0?e=e.slice(0,s.index)+`
[VI] (Đang cập nhật bản dịch)
`+e.slice(s.index):e+=`
[VI] (Đang cập nhật bản dịch)`}return l||(e+=o?`
[OP]
1. 好的 (Vâng)
2. 谢谢 (Cảm ơn)
3. 请继续 (Xin tiếp tục)`:`
[OP]
1. はい (Vâng)
2. ありがとうございます (Cảm ơn)
3. 続けてください (Xin tiếp tục)`),e}function b(t,c,o){if(t.length<2)return"";const i=o==="chinese"?"Tiếng Trung":"Tiếng Nhật",e=t.length,n=t.slice(-6),g=[];for(const l of n)if(l.role==="user"&&l.content.length>5){const s=l.content.length>50?l.content.substring(0,50)+"...":l.content;g.push(`- User: "${s}"`)}return`📍 Tình huống: ${c}
📍 Ngôn ngữ: ${i} (CHỈ dùng ngôn ngữ này)
📍 Đã trao đổi: ${e} tin nhắn
📍 Nội dung gần đây:
${g.slice(-3).join(`
`)}`}function E(t,c,o){const e={restaurant:[`かしこまりました。お席にご案内いたします。
(Vâng ạ. Tôi sẽ dẫn quý khách đến chỗ ngồi.)`,`お飲み物は何になさいますか？
(Quý khách dùng đồ uống gì ạ?)`,`お決まりになりましたら、お呼びください。
(Khi nào quyết định xong, xin gọi tôi ạ.)`],restaurant_cn:[`好的，请跟我来。
(Vâng, xin hãy đi theo tôi.)`,`请问想喝点什么？
(Cho hỏi bạn muốn uống gì?)`,`看好了请叫我。
(Xem xong hãy gọi tôi nhé.)`],hotel_cn:[`您的房间在三楼305号。
(Phòng của bạn ở phòng 305 tầng 3 ạ.)`,`早餐从七点到九点。
(Bữa sáng từ 7 giờ đến 9 giờ ạ.)`,`十一点退房。
(Trả phòng lúc 11 giờ ạ.)`],shopping_cn:[`这个怎么样？
(Cái này thế nào ạ?)`,`试衣间在那边。
(Phòng thử đồ ở đằng kia ạ.)`,`一共五千块。
(Tổng cộng là 5000 tệ ạ.)`],friend_cn:[`原来是这样！很有趣呢！
(Hóa ra là vậy! Thú vị thật đấy!)`,`下次一起去吧！
(Lần sau cùng đi nhé!)`,`再联系哦！
(Liên lạc lại nhé!)`],shopping:[`こちらはいかがでしょうか？
(Cái này thì sao ạ?)`,`試着室はあちらです。
(Phòng thử đồ ở đằng kia ạ.)`,`お会計は5000円になります。
(Tổng cộng là 5000 yên ạ.)`],hotel:[`お部屋は3階の305号室です。
(Phòng của quý khách là số 305 tầng 3 ạ.)`,`朝食は7時から9時までです。
(Bữa sáng từ 7 giờ đến 9 giờ ạ.)`,`チェックアウトは11時です。
(Check-out lúc 11 giờ ạ.)`],friend:[`そうなんだ！面白いね！
(Thế à! Thú vị nhỉ!)`,`今度一緒に行こうよ！
(Lần sau cùng đi nhé!)`,`また連絡するね！
(Liên lạc lại sau nhé!)`],interview:[`あなたの強みは何ですか？
(Điểm mạnh của bạn là gì?)`,`なぜ当社を選びましたか？
(Tại sao bạn chọn công ty chúng tôi?)`,`ご質問はありますか？
(Bạn có câu hỏi nào không?)`],doctor:[`いつからですか？
(Từ khi nào vậy?)`,`熱はありますか？
(Bạn có sốt không?)`,`お薬を出しておきますね。
(Tôi sẽ kê đơn thuốc cho bạn nhé.)`]}[c]||[o!=null&&o.some(n=>n.content.includes("[ZH]"))?`好的，我知道了。
(Vâng, tôi hiểu rồi.)`:`はい、わかりました。
(Vâng, tôi hiểu rồi.)`];return e[Math.floor(Math.random()*e.length)]}export{v as a,E as b,b as c,A as e,O as f,V as g};

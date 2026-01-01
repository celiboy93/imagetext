/** @jsxImportSource npm:hono/jsx */
import { Hono } from "npm:hono";

const app = new Hono();

app.get("/", (c) => {
  return c.html(
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Smart OCR - Image to Text</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" rel="stylesheet" />
        <script src='https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js'></script>
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700&family=Padauk:wght@400;700&display=swap');
          body { font-family: 'Inter', 'Padauk', sans-serif; background-color: #0f172a; color: white; }
          .glass { background: rgba(30, 41, 59, 0.7); backdrop-filter: blur(10px); border: 1px solid rgba(255, 255, 255, 0.1); }
          .loader-bar { transition: width 0.3s ease; }
        `}</style>
      </head>
      <body class="min-h-screen flex flex-col items-center p-4">
        
        <header class="w-full max-w-2xl flex justify-between items-center py-6">
            <h1 class="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-teal-400 to-blue-500">
                <i class="fa-solid fa-eye mr-2"></i>SMART OCR
            </h1>
        </header>

        <main class="w-full max-w-2xl space-y-6">
            
            {/* Upload Section */}
            <div class="glass rounded-2xl p-6 text-center border-dashed border-2 border-slate-600 hover:border-teal-500 transition cursor-pointer relative group" onclick="document.getElementById('fileInput').click()">
                <input type="file" id="fileInput" class="hidden" accept="image/*" onchange="loadImage(event)" />
                
                <div id="upload-placeholder" class="py-8">
                    <div class="w-16 h-16 bg-teal-500/20 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition">
                        <i class="fa-solid fa-file-import text-3xl text-teal-400"></i>
                    </div>
                    <p class="text-lg font-bold text-slate-200">ပုံတင်ရန် နှိပ်ပါ</p>
                    <p class="text-sm text-slate-400 mt-1">Clear Image = Better Result</p>
                </div>

                <div id="image-preview-container" class="hidden relative">
                    <img id="preview" class="max-h-64 mx-auto rounded-lg shadow-lg" />
                    <button onclick="event.stopPropagation(); clearImage()" class="absolute top-2 right-2 bg-red-600 text-white w-8 h-8 rounded-full flex items-center justify-center hover:bg-red-700 shadow-lg">
                        <i class="fa-solid fa-xmark"></i>
                    </button>
                </div>
            </div>

            {/* Hidden Canvas for Processing */}
            <canvas id="processing-canvas" class="hidden"></canvas>

            {/* Filters & Controls */}
            <div class="bg-slate-800/50 p-4 rounded-xl border border-slate-700">
                <label class="flex items-center gap-3 cursor-pointer mb-4">
                    <input type="checkbox" id="enhance-mode" class="w-5 h-5 accent-teal-500" checked />
                    <span class="text-sm text-slate-300">
                        <i class="fa-solid fa-wand-magic-sparkles text-yellow-400 mr-1"></i> 
                        Auto-Enhance (ပုံကို အဖြူအမဲပြောင်းပြီးဖတ်မည်)
                    </span>
                </label>

                <div class="flex gap-3">
                    <select id="lang-select" class="glass text-white px-4 py-3 rounded-xl flex-grow outline-none focus:border-teal-500 appearance-none cursor-pointer">
                        <option value="mya">🇲🇲 Myanmar (Burmese)</option>
                        <option value="eng">🇬🇧 English</option>
                        <option value="eng+mya">🌏 English + Myanmar</option>
                    </select>
                    <button onclick="convertText()" id="convert-btn" class="bg-gradient-to-r from-teal-600 to-blue-600 text-white font-bold px-6 py-3 rounded-xl hover:brightness-110 transition shadow-lg flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
                        <i class="fa-solid fa-bolt"></i> ဖတ်မယ်
                    </button>
                </div>
            </div>

            {/* Progress */}
            <div id="progress-container" class="hidden w-full bg-slate-700 rounded-full h-2.5 overflow-hidden">
                <div id="progress-bar" class="bg-teal-500 h-2.5 rounded-full loader-bar" style="width: 0%"></div>
            </div>
            <p id="status-text" class="text-xs text-center text-teal-400 hidden font-mono">Initializing engine...</p>

            {/* Result */}
            <div class="glass rounded-2xl p-4 relative">
                <div class="flex justify-between items-center mb-2 border-b border-slate-700 pb-2">
                    <span class="text-xs font-bold text-slate-400 uppercase">Result Text</span>
                    <button onclick="copyText()" class="text-xs text-teal-400 hover:text-teal-300 flex items-center gap-1">
                        <i class="fa-regular fa-copy"></i> Copy Text
                    </button>
                </div>
                <textarea id="result-text" class="w-full h-64 bg-transparent text-slate-200 outline-none resize-none font-mono text-sm leading-loose p-2" placeholder="စာတွေ ဒီမှာ ပေါ်လာပါလိမ့်မယ်..."></textarea>
            </div>

        </main>

        <script dangerouslySetInnerHTML={{__html: `
            let selectedFile = null;

            function loadImage(event) {
                const file = event.target.files[0];
                if (file) {
                    selectedFile = file;
                    const reader = new FileReader();
                    reader.onload = (e) => {
                        document.getElementById('preview').src = e.target.result;
                        document.getElementById('upload-placeholder').classList.add('hidden');
                        document.getElementById('image-preview-container').classList.remove('hidden');
                        document.getElementById('result-text').value = ""; 
                    };
                    reader.readAsDataURL(file);
                }
            }

            function clearImage() {
                selectedFile = null;
                document.getElementById('fileInput').value = "";
                document.getElementById('upload-placeholder').classList.remove('hidden');
                document.getElementById('image-preview-container').classList.add('hidden');
                document.getElementById('result-text').value = "";
            }

            // 🔥 IMAGE PROCESSING FUNCTION (The Fix)
            function preprocessImage(imageElement) {
                const canvas = document.getElementById('processing-canvas');
                const ctx = canvas.getContext('2d');
                
                canvas.width = imageElement.naturalWidth;
                canvas.height = imageElement.naturalHeight;
                ctx.drawImage(imageElement, 0, 0);
                
                const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                const data = imageData.data;

                // Thresholding (Convert to Black & White)
                // This makes text stand out clearly against background
                for (let i = 0; i < data.length; i += 4) {
                    const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
                    const color = avg > 100 ? 255 : 0; // Threshold value (Adjustable)
                    data[i] = color;     // R
                    data[i + 1] = color; // G
                    data[i + 2] = color; // B
                }
                
                ctx.putImageData(imageData, 0, 0);
                return canvas.toDataURL('image/jpeg');
            }

            async function convertText() {
                if (!selectedFile) {
                    alert("ပုံရွေးပေးပါဦး!");
                    return;
                }

                const btn = document.getElementById('convert-btn');
                const progressContainer = document.getElementById('progress-container');
                const progressBar = document.getElementById('progress-bar');
                const statusText = document.getElementById('status-text');
                const lang = document.getElementById('lang-select').value;
                const useEnhance = document.getElementById('enhance-mode').checked;

                btn.disabled = true;
                btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Reading...';
                progressContainer.classList.remove('hidden');
                statusText.classList.remove('hidden');
                document.getElementById('result-text').value = "";

                try {
                    let imageSource = selectedFile;

                    // Apply Filter if Checked
                    if (useEnhance) {
                        statusText.innerText = "Enhancing Image Quality...";
                        const img = document.getElementById('preview');
                        imageSource = preprocessImage(img);
                    }

                    const { data: { text } } = await Tesseract.recognize(
                        imageSource,
                        lang,
                        {
                            logger: m => {
                                if (m.status === 'recognizing text') {
                                    const percent = Math.round(m.progress * 100);
                                    progressBar.style.width = percent + "%";
                                    statusText.innerText = "Scanning... " + percent + "%";
                                } else {
                                    statusText.innerText = m.status;
                                }
                            }
                        }
                    );

                    document.getElementById('result-text').value = text;
                    statusText.innerText = "Completed!";
                    progressBar.style.width = "100%";

                } catch (error) {
                    console.error(error);
                    alert("Error: " + error.message);
                    statusText.innerText = "Failed to read text";
                } finally {
                    btn.disabled = false;
                    btn.innerHTML = '<i class="fa-solid fa-bolt"></i> ဖတ်မယ်';
                    setTimeout(() => {
                        progressContainer.classList.add('hidden');
                        statusText.classList.add('hidden');
                        progressBar.style.width = "0%";
                    }, 3000);
                }
            }

            function copyText() {
                const textArea = document.getElementById('result-text');
                textArea.select();
                document.execCommand('copy');
                const originalBtnText = document.querySelector('button[onclick="copyText()"]').innerHTML;
                document.querySelector('button[onclick="copyText()"]').innerHTML = '<i class="fa-solid fa-check"></i> Copied';
                setTimeout(() => {
                    document.querySelector('button[onclick="copyText()"]').innerHTML = originalBtnText;
                }, 2000);
            }
        `}} />
      </body>
    </html>
  );
});

Deno.serve(app.fetch);

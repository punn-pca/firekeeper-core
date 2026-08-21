const fs = require('fs');
let content = fs.readFileSync('src/components/Home.tsx', 'utf8');

// 1. Modify the Toolbar Settings & Execute Button
// Replace the settings button with just an icon
const settingsOld = `<button onClick={onOpenSettings} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-amber-500/30 text-amber-400/90 hover:bg-amber-500/10 text-[11px] font-mono transition-colors">
                    <span className="truncate max-w-[150px]">{selectedModel.replace('gemini-', 'Gemini ')} • {tone.split(' ')[0]}</span>
                  </button>`;
const settingsNew = `<button onClick={onOpenSettings} className="p-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-white/5 transition-colors" title="Settings">
                    <Sliders className="w-4 h-4" />
                  </button>`;
content = content.replace(settingsOld, settingsNew);

// Replace the Execute Button to take the remaining space
const execOld = `<div className="flex items-center ml-auto">
                  <button
                    onClick={handleSubmit}
                    disabled={!prompt.trim() && attachments.length === 0}
                    className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-500 hover:border-orange-500/80 text-white text-xs font-mono font-bold tracking-widest transition-all shadow-[0_4px_20px_rgba(0,0,0,0.3)] hover:shadow-[0_0_20px_rgba(249,115,22,0.3)] disabled:opacity-50 disabled:cursor-not-allowed"
                  >`;
const execNew = `<div className="flex items-center ml-auto flex-1">
                  <button
                    onClick={handleSubmit}
                    disabled={!prompt.trim() && attachments.length === 0}
                    className="flex-1 justify-center w-full flex items-center gap-2 px-6 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-500 hover:border-orange-500/80 text-white text-xs font-mono font-bold tracking-widest transition-all shadow-[0_4px_20px_rgba(0,0,0,0.3)] hover:shadow-[0_0_20px_rgba(249,115,22,0.3)] disabled:opacity-50 disabled:cursor-not-allowed"
                  >`;
content = content.replace(execOld, execNew);


// 2. Core Capabilities close to Recent Activity
// Find Recent Activity container and remove flex-1 and min-h-[200px]
content = content.replace(
  /<div className="bg-\[#0B1017\]\/80 border border-slate-800\/80 rounded-2xl p-5 flex flex-col shadow-xl flex-1 min-h-\[200px\]">/g,
  '<div className="bg-[#0B1017]/80 border border-slate-800/80 rounded-2xl p-5 flex flex-col shadow-xl">'
);

// 3. Move PCA Status to Center Column
const pcaStart = '{/* PCA Status */}';
const pcaEndIndex = content.indexOf('</div>', content.indexOf('ALL SYSTEMS OPERATIONAL')) + '</div>\n            </div>\n          </div>'.length;
const pcaStartIndex = content.indexOf(pcaStart);
if (pcaStartIndex !== -1) {
  let pcaContent = content.substring(pcaStartIndex, pcaEndIndex);
  
  // Remove PCA from original spot
  content = content.substring(0, pcaStartIndex) + content.substring(pcaEndIndex);

  // Style PCA Status to look good in the center column
  pcaContent = pcaContent.replace('className="bg-[#0B1017]/80 border border-slate-800/80 rounded-2xl p-5 shadow-2xl flex flex-col"', 'className="w-full max-w-sm bg-[#0B1017]/40 border border-slate-800/80 rounded-2xl p-4 sm:p-5 shadow-lg flex flex-col mb-4"');

  // Insert PCA Status before Trust Badges
  const trustBadgeStart = '{/* TRUST BADGES */}';
  content = content.replace(trustBadgeStart, pcaContent + '\n\n          ' + trustBadgeStart);
}

fs.writeFileSync('src/components/Home.tsx', content);
console.log('Done');

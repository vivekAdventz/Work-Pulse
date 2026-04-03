import { useRef } from 'react';
import { marked } from 'marked';
import html2pdf from 'html2pdf.js';
import { SparklesIcon, DownloadIcon } from './Icons';

export default function ReportModal({ reportData, isGenerating, onClose }) {
  const contentRef = useRef(null);

  const handleDownloadPdf = () => {
    if (!contentRef.current) return;
    const element = contentRef.current;
    const opt = {
      margin: 1,
      filename: 'summary_report.pdf',
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
    };
    html2pdf().set(opt).from(element).save();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl flex flex-col max-h-[90vh]">
        <div className="flex justify-between items-center p-6 border-b border-slate-200 bg-slate-50 rounded-t-xl">
          <h2 className="text-2xl font-bold flex items-center gap-2 text-indigo-700">
            <SparklesIcon /> Summary Report
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 font-bold text-xl px-2">
            &times;
          </button>
        </div>
        
        <div className="p-8 overflow-y-auto flex-1 bg-white">
          {isGenerating ? (
            <div className="flex flex-col items-center justify-center h-48 space-y-4">
              <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
              <p className="text-slate-600 font-medium animate-pulse">Generating insights with AI</p>
            </div>
          ) : reportData ? (
            <div 
              ref={contentRef}
              className="prose prose-indigo max-w-none text-slate-700 [&>h1]:text-2xl [&>h1]:font-bold [&>h2]:text-xl [&>h2]:font-bold [&>h3]:text-lg [&>h3]:font-semibold [&>h4]:text-base [&>h4]:font-semibold [&>ul]:list-disc [&>ul]:ml-6 [&>ul>li]:mb-2 [&>p]:mb-4 [&>hr]:my-4 [&>hr]:border-slate-200 [&_table]:w-full [&_table]:border-collapse [&_table]:text-sm [&_table]:my-4 [&_th]:bg-indigo-50 [&_th]:text-indigo-700 [&_th]:font-semibold [&_th]:px-3 [&_th]:py-2 [&_th]:text-left [&_th]:border [&_th]:border-indigo-200 [&_td]:px-3 [&_td]:py-2 [&_td]:border [&_td]:border-slate-200 [&_tr:nth-child(even)]:bg-slate-50 [&_strong]:text-slate-800"
              dangerouslySetInnerHTML={{ __html: marked.parse(reportData) }}
            />
          ) : (
            <p className="text-center text-slate-500">Failed to generate report.</p>
          )}
        </div>

        <div className="p-6 border-t border-slate-200 bg-slate-50 flex justify-end gap-4 rounded-b-xl">
          <button 
            onClick={onClose}
            className="px-6 py-2.5 rounded-lg font-medium text-slate-600 bg-white border border-slate-300 hover:bg-slate-50 transition-colors shadow-sm"
          >
            Close
          </button>
          <button 
            onClick={handleDownloadPdf}
            disabled={isGenerating || !reportData}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-lg font-medium text-white shadow-md transition-all ${
              isGenerating || !reportData 
                ? 'bg-indigo-300 cursor-not-allowed' 
                : 'bg-indigo-600 hover:bg-indigo-700 hover:shadow-lg active:scale-95'
            }`}
          >
            <DownloadIcon /> Download PDF
          </button>
        </div>
      </div>
    </div>
  );
}

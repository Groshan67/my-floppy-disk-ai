import React from 'react';

// تایپ‌بندی دقیق دیتایی که از Agent دریافت می‌کنید
interface AgentProjectData {
  title: string;
  description: string;
  url: string;
  image?: string;
  // سایر فیلدهای دریافتی از ایجنت را می‌توانید اینجا اضافه کنید
}

interface ProjectViewProps {
  projectData: AgentProjectData;
}

export const ProjectView: React.FC<ProjectViewProps> = ({ projectData }) => {
  return (
    <div className="w-full max-w-3xl bg-agent-dark border border-agent-gray p-6 font-ibm transition-colors duration-300 hover:border-agent-gold/50 group">
      
      {/* هدر: نمایش وضعیت و خطوط ترمینالی */}
      <div className="flex items-center justify-between border-b border-agent-gray pb-3 mb-6">
        <div className="flex items-center gap-2 text-agent-lightGray text-xs uppercase tracking-widest">
          <span className="w-2 h-2 bg-agent-gold animate-pulse"></span>
          Agent_Output_Stream
        </div>
        <div className="text-agent-gray text-xs">
          [ STATUS : ACTIVE ]
        </div>
      </div>

      {/* بخش تصویر با افکت Grayscale برای حفظ تم OpenDray */}
      {projectData.image && (
        <div className="w-full h-64 border border-agent-gray mb-6 relative overflow-hidden bg-black">
          <img
            src={projectData.image}
            alt={projectData.title}
            className="w-full h-full object-cover grayscale opacity-80 group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-500"
          />
          {/* اورلی رنگی ملایم برای هماهنگی با تم */}
          <div className="absolute inset-0 bg-agent-gold/5 pointer-events-none mix-blend-overlay"></div>
        </div>
      )}

      {/* بخش محتوا */}
      <div className="flex flex-col gap-4">
        <h1 className="font-pixel text-agent-gold text-lg md:text-xl leading-relaxed uppercase">
          {projectData.title}
        </h1>

        <p className="text-agent-lightGray text-sm md:text-base leading-relaxed text-justify">
          {projectData.description}
        </p>

        {/* بخش اکشن‌ها و URL */}
        <div className="mt-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-4 border-t border-agent-gray/50">
          <div className="text-xs text-agent-lightGray/70">
            TARGET_URL: <span className="text-agent-lightGray">{projectData.url}</span>
          </div>
          
          <a
            href={projectData.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center px-4 py-2 text-xs uppercase tracking-wider font-semibold text-agent-dark bg-agent-gold border border-agent-gold hover:bg-transparent hover:text-agent-gold transition-colors duration-200"
          >
            [ Initialize_Link ]
          </a>
        </div>
      </div>
      
    </div>
  );
};
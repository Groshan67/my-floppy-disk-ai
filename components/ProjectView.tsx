import React from 'react';

// تایپ‌بندی کامل دیتایی که از Agent دریافت می‌شود
interface AgentProjectData {
  title: string;
  description: string;
  url: string;
  image?: string;
  tags?: string[];
  whyItMatters?: string;
  stars?: number;
}

interface ProjectViewProps {
  projectData: AgentProjectData;
}

export const ProjectView: React.FC<ProjectViewProps> = ({ projectData }) => {
  return (
    <div className="w-full max-w-3xl bg-agent-dark border border-agent-gray p-6 font-ibm transition-colors duration-300 hover:border-agent-gold/50 group relative">
      
      {/* هدر: نمایش وضعیت، تعداد ستاره‌ها و خطوط ترمینالی */}
      <div className="flex items-center justify-between border-b border-agent-gray pb-3 mb-6">
        <div className="flex items-center gap-2 text-agent-lightGray text-xs uppercase tracking-widest">
          <span className="w-2 h-2 bg-agent-gold animate-pulse"></span>
          Agent_Output_Stream
        </div>

        <div className="flex items-center gap-4 text-xs">
          {/* نمایش تعداد ستاره‌ها در صورت وجود */}
          {typeof projectData.stars === 'number' && (
            <div className="flex items-center gap-1 text-agent-gold font-mono">
              <span>★</span>
              <span>{projectData.stars.toLocaleString()}</span>
            </div>
          )}
          <div className="text-agent-gray">
            [ STATUS : ACTIVE ]
          </div>
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
        
        {/* عنوان پروژه */}
        <h1 className="font-pixel text-agent-gold text-lg md:text-xl leading-relaxed uppercase">
          {projectData.title}
        </h1>

        {/* لیست تگ‌ها */}
        {projectData.tags && projectData.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 my-1">
            {projectData.tags.map((tag, idx) => (
              <span 
                key={idx}
                className="text-[10px] uppercase font-mono tracking-wider px-2 py-0.5 border border-agent-gray/60 text-agent-lightGray/80 bg-agent-gray/10"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}

        {/* توضیحات پروژه */}
        <p className="text-agent-lightGray text-sm md:text-base leading-relaxed text-justify">
          {projectData.description}
        </p>

        {/* چرا اهمیت دارد (Why It Matters) */}
        {projectData.whyItMatters && (
          <div className="mt-2 p-3 bg-agent-gray/20 border-r-2 border-agent-gold text-xs leading-relaxed text-agent-lightGray/90 font-mono">
            <span className="text-agent-gold font-semibold block mb-1 uppercase tracking-wider">
              &gt; WHY_IT_MATTERS:
            </span>
            {projectData.whyItMatters}
          </div>
        )}

        {/* بخش اکشن‌ها و URL */}
        <div className="mt-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-4 border-t border-agent-gray/50">
          <div className="text-xs text-agent-lightGray/70 truncate max-w-xs sm:max-w-md">
            TARGET_URL: <span className="text-agent-lightGray underline decoration-agent-gray">{projectData.url}</span>
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
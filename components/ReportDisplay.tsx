import React, { useEffect, useRef, useState, useMemo } from 'react';
import { MessageSquare, Users, ChevronDown, ChevronUp, Download, Printer, LayoutDashboard, Search, FileText, ArrowUp, Target, UserCircle, Share2 } from 'lucide-react';
import { BoardMember, ICPProfile, PersonaBreakdown, UserInput } from '../types';
import LoadingProgressBar from './LoadingProgressBar';
import SafeMarkdown from './SafeMarkdown';
import { SectionErrorBoundary } from './SectionErrorBoundary';

interface ReportDisplayProps {
  reportContent: string;
  isStreaming: boolean;
  onReset: () => void;
  members: BoardMember[];
  icpProfile?: ICPProfile;
  personaBreakdowns?: PersonaBreakdown[];
  qcStatus?: { score: number; verified: number; total: number; issues: number } | null;
  userInput?: UserInput | null;
  sessionId?: string | null;
  onShare?: () => void;
  isTrial?: boolean;
  onUpgrade?: () => void;
  subscriptionStatus?: {
    isTrial: boolean;
    reportsRemaining: number;
    needsUpgrade: boolean;
  };
}

const ReportDisplay: React.FC<ReportDisplayProps> = ({ reportContent, isStreaming, members, icpProfile, personaBreakdowns, qcStatus, userInput, onShare, isTrial, onUpgrade, subscriptionStatus }) => {
  const bottomRef = useRef<HTMLDivElement>(null);
  const [showMatrix, setShowMatrix] = useState(false); // Minimized by default
  const [showICPProfile, setShowICPProfile] = useState(false);
  const [showPersonaBreakdowns, setShowPersonaBreakdowns] = useState(false);
  const [activePersonaTab, setActivePersonaTab] = useState<number>(0);
  const [isReady, setIsReady] = useState(false);

  // Comprehensive logging on mount and when props change - dev only
  useEffect(() => {
    if (import.meta.env.DEV) {
      try {
        console.log('🔍 ReportDisplay mounted/updated:', {
          reportContentLength: reportContent?.length || 0,
          reportContentType: typeof reportContent,
          reportContentPreview: reportContent?.substring(0, 100),
          isStreaming,
          membersCount: members?.length || 0,
          membersType: Array.isArray(members),
          hasIcpProfile: !!icpProfile,
          icpProfileType: typeof icpProfile,
          personaBreakdownsCount: personaBreakdowns?.length || 0,
          personaBreakdownsType: Array.isArray(personaBreakdowns),
          hasQcStatus: !!qcStatus,
          qcStatusValue: qcStatus,
          qcStatusType: typeof qcStatus,
          qcStatusScore: qcStatus?.score,
          hasUserInput: !!userInput
        });
      } catch (logError) {
        console.error('Error in logging useEffect:', logError);
      }
    }
  }, [reportContent, isStreaming, members, icpProfile, personaBreakdowns, qcStatus, userInput]);

  // Validate and set ready state - only render when everything is validated
  useEffect(() => {
    try {
      // Don't set ready if still streaming
      if (isStreaming) {
        setIsReady(false);
        return;
      }

      // Validate report content exists - this is critical
      if (!reportContent || typeof reportContent !== 'string' || reportContent.trim().length === 0) {
        if (import.meta.env.DEV) {
          console.warn('⚠️ Report content is empty or invalid, not setting ready');
        }
        setIsReady(false);
        return;
      }

      // Validate members - this is also critical
      if (!Array.isArray(members) || members.length === 0) {
        if (import.meta.env.DEV) {
          console.warn('⚠️ Members array is empty or invalid, not setting ready');
        }
        setIsReady(false);
        return;
      }

      // Validate ICP Profile if present (but don't block rendering if invalid)
      if (icpProfile) {
        if (typeof icpProfile !== 'object' || Array.isArray(icpProfile)) {
          if (import.meta.env.DEV) {
            console.warn('⚠️ Invalid ICP Profile structure, will skip rendering it');
          }
        }
      }

      // Validate Persona Breakdowns if present (but don't block rendering if invalid)
      if (personaBreakdowns) {
        if (!Array.isArray(personaBreakdowns)) {
          if (import.meta.env.DEV) {
            console.warn('⚠️ Invalid Persona Breakdowns structure, will skip rendering it');
          }
        } else {
          // Validate each persona
          const invalidCount = personaBreakdowns.filter(p => {
            try {
              return !p || typeof p !== 'object' || !p.personaName || typeof p.personaName !== 'string';
            } catch {
              return true;
            }
          }).length;
          
          if (invalidCount > 0 && import.meta.env.DEV) {
            console.warn(`⚠️ Found ${invalidCount} invalid personas, will filter them out`);
          }
        }
      }

      // All critical validations passed, set ready immediately (no delay)
      if (import.meta.env.DEV) {
        console.log('✅ All validations passed, setting isReady to true');
      }
      setIsReady(true);
    } catch (validationError) {
      console.error('❌ Error in ready state validation:', validationError);
      setIsReady(false);
    }
  }, [reportContent, isStreaming, members, icpProfile, personaBreakdowns]);

  // Validate and sanitize props with deep validation
  const safeReportContent = (() => {
    try {
      if (typeof reportContent === 'string') {
        return reportContent;
      }
      if (reportContent === null || reportContent === undefined) {
        return '';
      }
      console.warn('⚠️ reportContent is not a string, converting:', typeof reportContent);
      return String(reportContent);
    } catch (e) {
      console.error('❌ Error validating reportContent:', e);
      return '';
    }
  })();

  const safeMembers = (() => {
    try {
      if (!members) return [];
      if (Array.isArray(members)) {
        // Filter out any invalid members
        return members.filter(m => m && typeof m === 'object' && m.id && m.name);
      }
      console.warn('⚠️ members is not an array:', typeof members);
      return [];
    } catch (e) {
      console.error('❌ Error validating members:', e);
      return [];
    }
  })();

  const safeIcpProfile = (() => {
    try {
      if (!icpProfile) return undefined;
      if (typeof icpProfile !== 'object' || Array.isArray(icpProfile)) {
        console.warn('⚠️ icpProfile is not a valid object:', typeof icpProfile);
        return undefined;
      }
      // Ensure all required arrays exist and are arrays
      const validated: any = {};
      if (icpProfile.titles && Array.isArray(icpProfile.titles)) {
        validated.titles = icpProfile.titles;
      } else {
        validated.titles = [];
      }
      if (icpProfile.useCaseFit && Array.isArray(icpProfile.useCaseFit)) {
        validated.useCaseFit = icpProfile.useCaseFit;
      } else {
        validated.useCaseFit = [];
      }
      if (icpProfile.signalsAndAttributes && Array.isArray(icpProfile.signalsAndAttributes)) {
        validated.signalsAndAttributes = icpProfile.signalsAndAttributes;
      } else {
        validated.signalsAndAttributes = [];
      }
      return validated;
    } catch (e) {
      console.error('❌ Error validating icpProfile:', e);
      return undefined;
    }
  })();

  const safePersonaBreakdowns = (() => {
    try {
      if (!personaBreakdowns) return [];
      if (!Array.isArray(personaBreakdowns)) {
        console.warn('⚠️ personaBreakdowns is not an array:', typeof personaBreakdowns);
        return [];
      }
      // Filter and validate each persona
      const filtered = personaBreakdowns.filter((p, idx) => {
        try {
          if (!p || typeof p !== 'object') {
            console.warn(`⚠️ Invalid persona at index ${idx}, filtering out`);
            return false;
          }
          // Ensure required fields exist
          if (!p.personaName || typeof p.personaName !== 'string') {
            console.warn(`⚠️ Persona at index ${idx} missing personaName, filtering out`);
            return false;
          }
          // Ensure decisionMakingProcess exists and is an object
          if (!p.decisionMakingProcess || typeof p.decisionMakingProcess !== 'object' || Array.isArray(p.decisionMakingProcess)) {
            console.warn(`⚠️ Persona at index ${idx} has invalid decisionMakingProcess, filtering out`);
            return false;
          }
          return true;
        } catch (filterError) {
          console.error(`Error filtering persona at index ${idx}:`, filterError);
          return false;
        }
      });
      return filtered;
    } catch (e) {
      console.error('❌ Error validating personaBreakdowns:', e);
      return [];
    }
  })();

  // Don't auto-scroll during streaming - keep user at top
  // Only scroll to top when report starts
  useEffect(() => {
    try {
      if (isStreaming && safeReportContent.length === 0) {
      window.scrollTo({ top: 0, behavior: 'instant' });
    }
    } catch (e) {
      console.warn('Error in scroll effect:', e);
    }
  }, [isStreaming, safeReportContent]);

  // Industry data functions removed - no longer used
  // Removed: isDashboardDataComplete, generateIndustryDataHtml

  // Export to HTML
  const handleDownloadHtml = async () => {
    if (isTrial && onUpgrade) {
      onUpgrade();
      return;
    }
    // Build comprehensive HTML structure matching the app
    let htmlContent = '';
    
    // Industry data fetching removed - no longer used
    
    // 1. Board Roster Section (Accordion)
    htmlContent += `
    <div class="mb-6 md:mb-8 bg-white rounded-lg border border-[#EEF2FF] shadow-sm overflow-hidden">
      <button onclick="toggleAccordion('roster')" class="w-full px-4 py-3 flex items-center justify-between bg-blue-50 hover:bg-blue-100 transition-colors border border-blue-100 rounded-t-lg cursor-pointer accordion-header" type="button">
        <div class="flex items-center gap-2 text-sm font-semibold text-[#595657]">
          <span>👥</span>
          Board Roster (${members.length} Members)
        </div>
        <span id="roster-chevron" class="text-[#595657]">▼</span>
      </button>
      <div id="roster-content" class="border-t border-[#EEF2FF] overflow-x-auto" style="display: none;">
        <table class="w-full text-left text-xs text-[#595657]">
          <thead class="bg-[#F9FAFD] text-[#383535] uppercase font-bold">
            <tr>
              <th class="px-4 py-2">Name</th>
              <th class="px-4 py-2">Role</th>
              <th class="px-4 py-2">Company</th>
              <th class="px-4 py-2">Archetype</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-[#EEF2FF]">
            ${members.map(m => `
              <tr class="hover:bg-[#F9FAFD]">
                <td class="px-4 py-2 font-bold text-[#221E1F]">${m.name}</td>
                <td class="px-4 py-2">${m.role}</td>
                <td class="px-4 py-2">${m.companyType}</td>
                <td class="px-4 py-2 text-[#577AFF]">${m.personalityArchetype}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </div>`;
    
    // 2. Persona Breakdowns Section (Accordion)
      if (safePersonaBreakdowns && safePersonaBreakdowns.length > 0) {
        const topPersonas = safePersonaBreakdowns.slice(0, 5);
      htmlContent += `
    <div class="mb-6 md:mb-8 bg-white rounded-lg border border-[#EEF2FF] shadow-sm overflow-hidden">
      <button onclick="toggleAccordion('personas')" class="w-full px-4 py-3 flex items-center justify-between bg-indigo-50 hover:bg-indigo-100 transition-colors border border-indigo-100 rounded-t-lg cursor-pointer accordion-header" type="button">
        <div class="flex items-center gap-2 text-sm font-semibold text-[#595657]">
          <span>👤</span>
          Persona Breakdowns (${topPersonas.length} Personas)
        </div>
        <span id="personas-chevron" class="text-[#595657]">▼</span>
      </button>
      <div id="personas-content" class="border-t border-[#EEF2FF] p-4 md:p-6" style="display: none;">
        <!-- Tabbed Navigation -->
        <div class="mb-6 border-b border-[#EEF2FF]">
          <div class="flex flex-wrap gap-2">
            ${topPersonas.map((persona, idx) => `
              <a href="#persona-${idx}" class="px-4 py-2 text-sm font-semibold rounded-t-lg transition-colors bg-[#F9FAFD] text-[#595657] hover:bg-[#EEF2FF] border-b-2 border-transparent hover:border-[#577AFF]">
                ${persona.personaName}
              </a>
            `).join('')}
          </div>
        </div>
        
        <div class="space-y-10">
          ${topPersonas.map((persona, idx) => {
            const initials = persona.personaName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
            const avatarColors = ['purple', 'emerald', 'amber', 'rose', 'teal'];
            const avatarColor = avatarColors[idx % avatarColors.length];
            
            return `
          <div id="persona-${idx}" class="border-b border-[#EEF2FF] pb-8 last:border-b-0 last:pb-0 bg-white rounded-lg p-6 border border-[#EEF2FF] shadow-sm">
            <!-- Header with Avatar -->
            <div class="mb-6 flex items-start gap-4">
              <div class="flex-shrink-0">
                <div class="w-20 h-20 rounded-full bg-gradient-to-br from-${avatarColor}-400 to-${avatarColor}-600 flex items-center justify-center text-white text-2xl font-bold shadow-md border-2 border-white ring-1 ring-[#EEF2FF]">
                  ${initials}
                </div>
              </div>
              <div class="flex-1">
                <h2 class="text-3xl font-bold text-[#221E1F] mb-2">${persona.personaName}</h2>
                <p class="text-xl font-bold text-[#221E1F] mb-1">${persona.personaTitle}</p>
                <p class="text-base font-semibold text-[#221E1F] italic">${persona.buyerType}</p>
              </div>
            </div>
            
            <div class="space-y-5 text-[#595657]">
              <!-- Age -->
              <div>
                <p class="font-semibold text-[#221E1F] mb-1"><strong>Age:</strong> ${persona.ageRange}</p>
              </div>
              
              <!-- Preferred Communication Channels -->
              <div>
                <p class="font-semibold text-[#221E1F] mb-1"><strong>Preferred Communication Channel(s):</strong></p>
                <ul class="list-none space-y-0.5 mt-1">
                  ${persona.preferredCommunicationChannels.map(ch => `<li class="pl-0">• ${ch}</li>`).join('')}
                </ul>
              </div>
              
              <!-- Titles -->
              <div>
                <p class="font-semibold text-[#221E1F] mb-1"><strong>Title(s):</strong></p>
                <ul class="list-none space-y-0.5 mt-1">
                  ${persona.titles.map(t => `<li class="pl-0">• ${t}</li>`).join('')}
                </ul>
              </div>
              
              ${persona.otherRelevantInfo && persona.otherRelevantInfo.length > 0 ? `
              <!-- Other Relevant Info -->
              <div>
                <p class="font-semibold text-[#221E1F] mb-1"><strong>Other Relevant Info:</strong></p>
                <ul class="list-none space-y-0.5 mt-1">
                  ${persona.otherRelevantInfo.map(info => `<li class="pl-0">• ${info}</li>`).join('')}
                </ul>
              </div>
              ` : ''}
              
              <!-- Attributes -->
              <div>
                <p class="font-semibold text-[#221E1F] mb-2"><strong>Attributes</strong></p>
                <div class="space-y-1">
                  ${persona.attributes.map(attr => `
                    <label class="flex items-center gap-2 cursor-default">
                      <input type="checkbox" checked readonly class="w-4 h-4 text-[#577AFF] rounded border-[#D5DDFF]">
                      <span class="text-[#221E1F]">${attr}</span>
                    </label>
                  `).join('')}
                </div>
              </div>
              
              <!-- Jobs to be Done -->
              <div>
                <h3 class="font-bold text-lg text-[#221E1F] mb-2">Jobs to be Done</h3>
                <ul class="list-none space-y-2 mt-2">
                  ${persona.jobsToBeDone.map(job => `<li class="leading-relaxed pl-0">• ${job}</li>`).join('')}
                </ul>
              </div>
              
              <!-- Decision-Making Process -->
              <div>
                <h3 class="font-bold text-lg text-[#221E1F] mb-3">Decision-Making Process</h3>
                <div class="space-y-4">
                  <!-- Research -->
                  <div>
                    <h4 class="font-bold text-base text-[#221E1F] mb-1">1. Research</h4>
                    <p class="text-sm text-[#595657] italic mb-2">${persona.decisionMakingProcess.research.description}</p>
                    <ul class="list-none space-y-0.5">
                      ${persona.decisionMakingProcess.research.sources.map(s => `<li class="pl-0">• ${s}</li>`).join('')}
                    </ul>
                  </div>
                  
                  <!-- Evaluation -->
                  <div>
                    <h4 class="font-bold text-base text-[#221E1F] mb-1">2. Evaluation</h4>
                    <p class="text-sm text-[#595657] italic mb-2">${persona.decisionMakingProcess.evaluation.description}</p>
                    <ul class="list-none space-y-0.5">
                      ${persona.decisionMakingProcess.evaluation.factors.map(f => `<li class="pl-0">• ${f}</li>`).join('')}
                    </ul>
                  </div>
                  
                  <!-- Purchase -->
                  <div>
                    <h4 class="font-bold text-base text-[#221E1F] mb-1">3. Purchase</h4>
                    <p class="text-sm text-[#595657] italic mb-2">${persona.decisionMakingProcess.purchase.description}</p>
                    <div class="space-y-2">
                      <div>
                        <p class="text-sm font-medium text-[#221E1F] mb-1">What convinces me:</p>
                        <ul class="list-none space-y-0.5">
                          ${persona.decisionMakingProcess.purchase.purchaseFactors.map(f => `<li class="pl-0">• ${f}</li>`).join('')}
                        </ul>
                      </div>
                      <div>
                        <p class="text-sm font-medium text-[#221E1F] mb-1">What makes me hesitate:</p>
                        <ul class="list-none space-y-0.5">
                          ${persona.decisionMakingProcess.purchase.hesitations.map(h => `<li class="pl-0">• ${h}</li>`).join('')}
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <!-- Challenges -->
              <div>
                <h3 class="font-bold text-lg text-[#221E1F] mb-2">Challenges</h3>
                <ul class="list-none space-y-2 mt-2">
                  ${persona.challenges.map(c => `<li class="leading-relaxed pl-0">• ${c}</li>`).join('')}
                </ul>
              </div>
            </div>
            
            <!-- Back to Top Link -->
            <div class="mt-6 pt-4 border-t border-[#EEF2FF] flex justify-end">
              <a href="#top" class="flex items-center gap-1 text-xs font-bold text-[#595657] hover:text-[#577AFF] transition-colors uppercase tracking-wider">
                Back to top ↑
              </a>
            </div>
          </div>
            `;
          }).join('')}
        </div>
      </div>
    </div>`;
    }
    
    // 3. ICP Profile Section (Accordion)
    if (icpProfile) {
      htmlContent += `
    <div class="mb-6 md:mb-8 bg-white rounded-lg border border-[#EEF2FF] shadow-sm overflow-hidden">
      <button onclick="toggleAccordion('icp')" class="w-full px-4 py-3 flex items-center justify-between bg-cyan-50 hover:bg-cyan-100 transition-colors border border-cyan-100 rounded-t-lg cursor-pointer accordion-header" type="button">
        <div class="flex items-center gap-2 text-sm font-semibold text-[#595657]">
          <span>🎯</span>
          ICP Profile Report
        </div>
        <span id="icp-chevron" class="text-[#595657]">▼</span>
      </button>
      <div id="icp-content" class="border-t border-[#EEF2FF] p-4 md:p-6 bg-white" style="display: none;">
        <div class="space-y-8">
          <!-- Titles -->
          <div>
            <h2 class="text-xl font-bold text-[#221E1F] mb-4 pb-2 border-b-2 border-[#EEF2FF]">Titles</h2>
            <div class="space-y-6">
              ${(safeIcpProfile.titles || []).map((titleGroup: any) => `
                <div>
                  <h3 class="font-bold text-[#221E1F] mb-3 text-base">${titleGroup?.department || 'N/A'}</h3>
                  <ul class="list-none space-y-1 text-[#595657]">
                    ${(Array.isArray(titleGroup?.roles) ? titleGroup.roles : []).map((role: any) => `<li class="pl-0">• ${role || 'N/A'}</li>`).join('')}
                  </ul>
                </div>
              `).join('')}
            </div>
          </div>
          
          <!-- Use Case Fit -->
          <div>
            <h2 class="text-xl font-bold text-[#221E1F] mb-4 pb-2 border-b-2 border-[#EEF2FF]">Use Case Fit</h2>
            <ul class="list-none space-y-2 text-[#595657]">
              ${(Array.isArray(safeIcpProfile.useCaseFit) ? safeIcpProfile.useCaseFit : []).map((useCase: any) => `<li class="leading-relaxed pl-0">• ${useCase || 'N/A'}</li>`).join('')}
            </ul>
          </div>
          
          <!-- Signals & Attributes -->
          <div>
            <h2 class="text-xl font-bold text-[#221E1F] mb-4 pb-2 border-b-2 border-[#EEF2FF]">Signals & Attributes</h2>
            <div class="space-y-4">
              ${(Array.isArray(safeIcpProfile.signalsAndAttributes) ? safeIcpProfile.signalsAndAttributes : []).map((signal: any) => `
                <div class="border-l-4 border-[#577AFF] pl-4 py-2">
                  <h3 class="font-bold text-[#221E1F] mb-2 text-base">${signal?.category || 'N/A'}</h3>
                  <p class="leading-relaxed mb-1 text-[#595657]">${signal?.description || 'N/A'}</p>
                  ${signal?.triggerQuestion ? `<p class="text-[#577AFF] italic text-sm mt-1">"${signal.triggerQuestion}"</p>` : ''}
                </div>
              `).join('')}
            </div>
          </div>
        </div>
      </div>
    </div>`;
      }
    
    // Industry Data Section Removed
    
    // 4. Main Report Sections
    const sections = reportContent.split(/(?=\n# |^# )/g).filter(s => s.trim().length > 0);
    
    sections.forEach((section) => {
      const titleMatch = section.match(/^#\s*(.+)/);
      let title = titleMatch && titleMatch[1] ? titleMatch[1].trim() : '';
      
      // Add "(How We Win)" to "Pricing Strategy Recommendations"
      if (title.toLowerCase().includes('pricing strategy recommendations') && !title.toLowerCase().includes('how we win')) {
        title = title.replace(/pricing strategy recommendations/gi, 'Pricing Strategy Recommendations (How We Win)');
      }
      
      if (!title || title.length > 50) {
        if (section.includes('Status') && section.includes('Category')) title = "Executive Dashboard";
        else if (section.includes('Key Research') || section.includes('Findings')) title = "Key Research Findings & Facts";
        else if (section.includes('Roast') || section.includes('Gold')) title = "The Roast & The Gold";
        else if (section.includes('Deep Dive') || section.includes('Messaging Analysis')) title = "Deep Dive Analysis";
        else if (section.includes('Transcript')) title = "Raw Board Transcript";
        else title = "Analysis Section";
      }
      
      // Determine section colors
      const lower = title.toLowerCase();
      let bgColor = 'bg-blue-50';
      let borderColor = 'border-blue-100';
      let textColor = 'text-[#577AFF]';
      
      if (lower.includes('executive') || lower.includes('dashboard')) {
        bgColor = 'bg-blue-50';
        borderColor = 'border-blue-100';
        textColor = 'text-[#577AFF]';
      } else if (lower.includes('key research') || lower.includes('findings')) {
        bgColor = 'bg-cyan-50';
        borderColor = 'border-cyan-100';
        textColor = 'text-[#577AFF]';
      } else if (lower.includes('deep dive') || lower.includes('analysis')) {
        bgColor = 'bg-indigo-50';
        borderColor = 'border-indigo-100';
        textColor = 'text-[#31458F]';
      } else if (lower.includes('roast') || lower.includes('gold')) {
        bgColor = 'bg-orange-50';
        borderColor = 'border-orange-100';
        textColor = 'text-[#577AFF]';
      } else if (lower.includes('transcript')) {
        bgColor = 'bg-purple-50';
        borderColor = 'border-purple-100';
        textColor = 'text-[#577AFF]';
      }
      
      const bodyContent = section.replace(/^\s*#\s*.*(\r?\n|$)/, '').trim();
      
      // Process markdown content - convert to HTML
      let processedContent = bodyContent;
      
      // Convert markdown tables to HTML - handle complex content
      const tableRegex = /(\|.+\|(?:\n\|.+\|)+)/g;
      processedContent = processedContent.replace(tableRegex, (match) => {
        const lines = match.trim().split('\n').filter(l => l.trim());
        if (lines.length < 2) return match;
        
        // Skip separator row (second line with dashes)
        const headerLine = lines[0];
        const dataLines = lines.slice(2);
        
        const parseTableRow = (line: string): string[] => {
          return line.split('|').map(c => c.trim()).filter(c => c.length > 0);
        };
        
        const header = headerLine ? parseTableRow(headerLine) : [];
        const rows = dataLines.map(parseTableRow);
        
        // Process cell content - handle <br>, numbered lists, bold, etc.
        const processCellContent = (content: string): string => {
          let processed = content;
          
          // Convert numbered lists (1. **text**, 2. **text**)
          processed = processed.replace(/(\d+)\.\s*\*\*(.*?)\*\*/g, '<strong>$2</strong>');
          processed = processed.replace(/(\d+)\.\s*/g, '<br />$1. ');
          
          // Convert <br> tags (handle both <br> and <br />)
          processed = processed.replace(/&lt;br\s*\/?&gt;/gi, '<br />');
          processed = processed.replace(/<br\s*\/?>/gi, '<br />');
          
          // Convert bold
          processed = processed.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
          
          // Convert italic
          processed = processed.replace(/\*(.*?)\*/g, '<em>$1</em>');
          
          // Clean up leading <br />
          processed = processed.replace(/^<br\s*\/?>\s*/i, '');
          
          return processed;
        };
        
        let tableHtml = '<table class="w-full border-collapse my-6 text-xs leading-relaxed"><thead><tr class="bg-[#EEF2FF] text-[#051A53] font-bold">';
        header.forEach(cell => {
          tableHtml += `<th class="p-4 text-left font-bold border border-[#D5DDFF]">${cell}</th>`;
        });
        tableHtml += '</tr></thead><tbody>';
        
        rows.forEach((row, rowIdx) => {
          const bgClass = rowIdx % 2 === 0 ? 'bg-white' : 'bg-[#F9FAFD]';
          tableHtml += `<tr class="${bgClass} border-b border-[#EEF2FF]">`;
          row.forEach((cell, cellIdx) => {
            const cellContent = processCellContent(cell);
            const isLastCell = cellIdx === row.length - 1;
            const cellClass = isLastCell ? 'text-[#577AFF] font-normal' : '';
            tableHtml += `<td class="p-4 border border-[#EEF2FF] align-top ${cellClass}">${cellContent}</td>`;
          });
          tableHtml += '</tr>';
        });
        tableHtml += '</tbody></table>';
        return tableHtml;
      });
      
      // Convert headers - match current visual styling
      // Reduced spacing: mb-4 mt-4 instead of mb-6 mt-8, but keep at least one line
      processedContent = processedContent.replace(/^### (.*$)/gim, (_match, text) => {
        if (text.includes('🔥 The Roast') || text.includes('🏆 The Gold') || text.includes('The Roast') || text.includes('The Gold')) {
          return `<h3 class="text-base font-bold text-[#221E1F] mb-4 pb-4 block border-b border-[#EEF2FF]">${text}</h3>`;
        }
        return `<h3 class="text-lg md:text-xl font-bold !font-bold text-[#051A53] bg-[#F9FAFD] px-4 py-3 rounded-lg mb-4 mt-2" style="font-weight: bold;">${text}</h3>`;
      });
      processedContent = processedContent.replace(/^## (.*$)/gim, '<h2 class="text-xl font-bold text-[#221E1F] mt-8 mb-4 pb-2 border-b-2 border-[#EEF2FF]">$1</h2>');
      
      // Convert bold
      processedContent = processedContent.replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold text-[#221E1F]">$1</strong>');
      
      // Convert italic
      processedContent = processedContent.replace(/\*(.*?)\*/g, '<em>$1</em>');
      
      // Convert lists
      processedContent = processedContent.replace(/^[\*\-\+] (.+)$/gim, '<li class="ml-4 mb-2 marker:text-[#A1B4FF]">$1</li>');
      processedContent = processedContent.replace(/(<li.*<\/li>)/s, '<ul class="list-disc space-y-3 my-4 pl-2">$1</ul>');
      
      // Convert paragraphs (but not if already in a tag)
      // Reduced spacing: my-4 instead of my-6 to tighten up spacing
      processedContent = processedContent.split('\n').map(line => {
        line = line.trim();
        if (!line) return '';
        if (line.startsWith('<')) return line;
        if (line.match(/^[#\*\-]/)) return line;
        return `<p class="text-[#595657] leading-loose my-4">${line}</p>`;
      }).join('\n');
      
      // Convert <br> tags
      processedContent = processedContent.replace(/<br\s*\/?>/gi, '<br />');
      
      htmlContent += `
    <div class="bg-white rounded-xl border ${borderColor} shadow-sm overflow-hidden">
      <div class="px-4 py-3 md:px-6 md:py-4 border-b ${borderColor} ${bgColor} flex items-center gap-3">
        <h2 class="text-lg md:text-xl font-bold ${textColor}">${title}</h2>
      </div>
      <div class="p-4 md:p-8">
        <div class="prose prose-slate prose-sm md:prose-base max-w-none">
          ${processedContent}
        </div>
        <div class="mt-8 pt-6 border-t border-[#EEF2FF] flex justify-end">
          <a href="#top" class="flex items-center gap-1 text-xs font-bold text-[#595657] hover:text-[#577AFF] transition-colors uppercase tracking-wider">
            Back to top ↑
          </a>
        </div>
      </div>
    </div>`;
    });
    
    const fullHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>The Zulu Method Report</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    
    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      max-width: 1400px;
      margin: 0 auto;
      padding: 20px;
      line-height: 1.6;
      background: #F9FAFD;
      color: #221E1F;
    }
    
    /* Color Palette */
    .bg-\\[\\#EEF2FF\\], [class*="bg-\\[\\#EEF2FF\\]"] { background-color: #EEF2FF !important; }
    .bg-\\[\\#D5DDFF\\], [class*="bg-\\[\\#D5DDFF\\]"] { background-color: #D5DDFF !important; }
    .bg-\\[\\#A1B4FF\\], [class*="bg-\\[\\#A1B4FF\\]"] { background-color: #A1B4FF !important; }
    .bg-\\[\\#F9FAFD\\], [class*="bg-\\[\\#F9FAFD\\]"] { background-color: #F9FAFD !important; }
    .bg-\\[\\#577AFF\\], [class*="bg-\\[\\#577AFF\\]"] { background-color: #577AFF !important; }
    .bg-\\[\\#31458F\\], [class*="bg-\\[\\#31458F\\]"] { background-color: #31458F !important; }
    .bg-\\[\\#051A53\\], [class*="bg-\\[\\#051A53\\]"] { background-color: #051A53 !important; }
    .bg-\\[\\#221E1F\\], [class*="bg-\\[\\#221E1F\\]"] { background-color: #221E1F !important; }
    .bg-\\[\\#383535\\], [class*="bg-\\[\\#383535\\]"] { background-color: #383535 !important; }
    .bg-\\[\\#595657\\], [class*="bg-\\[\\#595657\\]"] { background-color: #595657 !important; }
    
    .text-\\[\\#577AFF\\], [class*="text-\\[\\#577AFF\\]"] { color: #577AFF !important; }
    .text-\\[\\#051A53\\], [class*="text-\\[\\#051A53\\]"] { color: #051A53 !important; }
    .text-\\[\\#221E1F\\], [class*="text-\\[\\#221E1F\\]"] { color: #221E1F !important; }
    .text-\\[\\#383535\\], [class*="text-\\[\\#383535\\]"] { color: #383535 !important; }
    .text-\\[\\#595657\\], [class*="text-\\[\\#595657\\]"] { color: #595657 !important; }
    
    .border-\\[\\#EEF2FF\\], [class*="border-\\[\\#EEF2FF\\]"] { border-color: #EEF2FF !important; }
    .border-\\[\\#D5DDFF\\], [class*="border-\\[\\#D5DDFF\\]"] { border-color: #D5DDFF !important; }
    .border-\\[\\#A1B4FF\\], [class*="border-\\[\\#A1B4FF\\]"] { border-color: #A1B4FF !important; }
    
    /* Pastel Colors */
    .bg-blue-50 { background-color: #EFF6FF !important; }
    .bg-cyan-50 { background-color: #ECFEFF !important; }
    .bg-indigo-50 { background-color: #EEF2FF !important; }
    .bg-orange-50 { background-color: #FFF7ED !important; }
    .bg-purple-50 { background-color: #FAF5FF !important; }
    .bg-emerald-50 { background-color: #ECFDF5 !important; }
    .bg-amber-50 { background-color: #FFFBEB !important; }
    .bg-rose-50 { background-color: #FFF1F2 !important; }
    .bg-teal-50 { background-color: #F0FDFA !important; }
    
    .border-blue-100 { border-color: #DBEAFE !important; }
    .border-cyan-100 { border-color: #CFFAFE !important; }
    .border-indigo-100 { border-color: #E0E7FF !important; }
    .border-orange-100 { border-color: #FFEDD5 !important; }
    .border-purple-100 { border-color: #F3E8FF !important; }
    
    .from-purple-400 { --tw-gradient-from: #A78BFA; }
    .to-purple-600 { --tw-gradient-to: #9333EA; }
    .from-emerald-400 { --tw-gradient-from: #34D399; }
    .to-emerald-600 { --tw-gradient-to: #059669; }
    .from-amber-400 { --tw-gradient-from: #FBBF24; }
    .to-amber-600 { --tw-gradient-to: #D97706; }
    .from-rose-400 { --tw-gradient-from: #FB7185; }
    .to-rose-600 { --tw-gradient-to: #E11D48; }
    .from-teal-400 { --tw-gradient-from: #2DD4BF; }
    .to-teal-600 { --tw-gradient-to: #0D9488; }
    
    .bg-gradient-to-br {
      background-image: linear-gradient(to bottom right, var(--tw-gradient-from), var(--tw-gradient-to));
    }
    
    /* Typography */
    h1, h2, h3, h4, h5, h6 { font-weight: bold; margin-top: 1.5rem; margin-bottom: 1rem; }
    h1 { font-size: 2rem; }
    h2 { font-size: 1.5rem; border-bottom: 2px solid #EEF2FF; padding-bottom: 0.5rem; }
    h3 { font-size: 1.25rem; background: #F9FAFD; padding: 0.75rem 1rem; border-radius: 0.5rem; }
    
    p { margin-bottom: 1.5rem; }
    
    /* Tables - Print only (light mode for printing) */
    table { border-collapse: collapse; width: 100%; margin: 1.5rem 0; border: 1px solid #EEF2FF; }
    thead { background: #EEF2FF !important; }
    th { background: #EEF2FF !important; color: #051A53 !important; padding: 1rem; text-align: left; font-weight: bold; border: 1px solid #D5DDFF !important; }
    tbody tr:nth-child(odd) { background: white !important; }
    tbody tr:nth-child(even) { background: #F9FAFD !important; }
    td { padding: 1rem; border: 1px solid #EEF2FF !important; vertical-align: top; color: #595657 !important; }
    tr { border-bottom: 1px solid #EEF2FF; }
    
    /* Blockquotes */
    blockquote { 
      border-left: 4px solid #577AFF; 
      padding-left: 1rem; 
      padding-top: 0.5rem; 
      padding-bottom: 0.5rem; 
      margin: 1.5rem 0; 
      background: #F9FAFD; 
      font-style: italic; 
      color: #221E1F;
      border-radius: 0 0.5rem 0.5rem 0;
    }
    
    /* Lists */
    ul { list-style-type: disc; padding-left: 1.5rem; margin: 1rem 0; }
    li { margin: 0.5rem 0; color: #595657; }
    
    /* Utilities */
    .rounded-xl { border-radius: 0.75rem; }
    .rounded-lg { border-radius: 0.5rem; }
    .rounded-t-lg { border-top-left-radius: 0.5rem; border-top-right-radius: 0.5rem; }
    .shadow-sm { box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05); }
    .space-y-2 > * + * { margin-top: 0.5rem; }
    .space-y-4 > * + * { margin-top: 1rem; }
    .space-y-5 > * + * { margin-top: 1.25rem; }
    .space-y-6 > * + * { margin-top: 1.5rem; }
    .space-y-8 > * + * { margin-top: 2rem; }
    .space-y-10 > * + * { margin-top: 2.5rem; }
    .mb-1 { margin-bottom: 0.25rem; }
    .mb-2 { margin-bottom: 0.5rem; }
    .mb-3 { margin-bottom: 0.75rem; }
    .mb-4 { margin-bottom: 1rem; }
    .mb-6 { margin-bottom: 1.5rem; }
    .mb-8 { margin-bottom: 2rem; }
    .mt-1 { margin-top: 0.25rem; }
    .mt-2 { margin-top: 0.5rem; }
    .mt-6 { margin-top: 1.5rem; }
    .mt-8 { margin-top: 2rem; }
    .p-4 { padding: 1rem; }
    .p-6 { padding: 1.5rem; }
    .px-4 { padding-left: 1rem; padding-right: 1rem; }
    .py-2 { padding-top: 0.5rem; padding-bottom: 0.5rem; }
    .py-3 { padding-top: 0.75rem; padding-bottom: 0.75rem; }
    .py-4 { padding-top: 1rem; padding-bottom: 1rem; }
    .pb-2 { padding-bottom: 0.5rem; }
    .pb-4 { padding-bottom: 1rem; }
    .pb-8 { padding-bottom: 2rem; }
    .pt-4 { padding-top: 1rem; }
    .pt-6 { padding-top: 1.5rem; }
    .pl-0 { padding-left: 0; }
    .pl-3 { padding-left: 0.75rem; }
    .pl-4 { padding-left: 1rem; }
    .gap-1 { gap: 0.25rem; }
    .gap-2 { gap: 0.5rem; }
    .gap-3 { gap: 0.75rem; }
    .gap-4 { gap: 1rem; }
    .flex { display: flex; }
    .flex-col { flex-direction: column; }
    .flex-wrap { flex-wrap: wrap; }
    .items-center { align-items: center; }
    .items-start { align-items: flex-start; }
    .justify-end { justify-content: flex-end; }
    .flex-1 { flex: 1 1 0%; }
    .flex-shrink-0 { flex-shrink: 0; }
    .text-xs { font-size: 0.75rem; }
    .text-sm { font-size: 0.875rem; }
    .text-base { font-size: 1rem; }
    .text-lg { font-size: 1.125rem; }
    .text-xl { font-size: 1.25rem; }
    .text-2xl { font-size: 1.5rem; }
    .text-3xl { font-size: 1.875rem; }
    .font-bold { font-weight: 700; }
    .font-semibold { font-weight: 600; }
    .font-extrabold { font-weight: 800; }
    .font-normal { font-weight: 400; }
    .leading-relaxed { line-height: 1.625; }
    .leading-loose { line-height: 2; }
    .leading-tight { line-height: 1.25; }
    .uppercase { text-transform: uppercase; }
    .italic { font-style: italic; }
    .border { border-width: 1px; }
    .border-2 { border-width: 2px; }
    .border-4 { border-width: 4px; }
    .border-b { border-bottom-width: 1px; }
    .border-b-2 { border-bottom-width: 2px; }
    .border-l-4 { border-left-width: 4px; }
    .border-t { border-top-width: 1px; }
    .overflow-hidden { overflow: hidden; }
    .overflow-x-auto { overflow-x: auto; }
    .w-full { width: 100%; }
    .w-4 { width: 1rem; }
    .w-20 { width: 5rem; }
    .h-4 { height: 1rem; }
    .h-20 { height: 5rem; }
    .rounded-full { border-radius: 9999px; }
    .text-left { text-align: left; }
    .text-center { text-align: center; }
    .divide-y > * + * { border-top-width: 1px; border-top-color: #EEF2FF; }
    .list-none { list-style-type: none; padding-left: 0; }
    .cursor-default { cursor: default; }
    .hover\\:bg-\\[\\#EEF2FF\\]:hover { background-color: #EEF2FF; }
    .hover\\:text-\\[\\#577AFF\\]:hover { color: #577AFF; }
    .transition-colors { transition-property: color, background-color, border-color; transition-duration: 150ms; }
    .tracking-wider { letter-spacing: 0.05em; }
    .tracking-tight { letter-spacing: -0.025em; }
    
          /* Print styles */
          @media print {
            @page {
              margin: 0.75in;
            }
            body { 
              background: white; 
              margin: 0;
              padding: 0;
            }
            .no-print { display: none !important; }
            
            /* Print header */
            body::before {
              content: '';
              display: block;
              background-color: #051A53;
              padding: 0.75rem 1rem;
              margin-bottom: 1rem;
              border-bottom: 3px solid #577AFF;
            }
            
            /* Print footer */
            body::after {
              content: 'The Zulu Method | thezulumethod.com | customer@thezulumethod.com';
              display: block;
              background-color: #051A53;
              color: #A1B4FF;
              padding: 0.75rem 1rem;
              margin-top: 2rem;
              text-align: center;
              font-size: 0.75rem;
              border-top: 3px solid #577AFF;
            }
          }
    
    /* Links */
    a { color: #577AFF; text-decoration: none; }
    a:hover { text-decoration: underline; }
    
    /* Checkbox styling */
    input[type="checkbox"] { appearance: none; width: 1rem; height: 1rem; border: 1px solid #D5DDFF; border-radius: 0.25rem; }
    input[type="checkbox"]:checked { background-color: #577AFF; border-color: #577AFF; }
    input[type="checkbox"]:checked::before { content: "✓"; color: white; display: block; text-align: center; font-size: 0.75rem; line-height: 1rem; }
    
    /* Accordion styling */
    .accordion-header { cursor: pointer; user-select: none; }
    .accordion-header:hover { background-color: rgba(0, 0, 0, 0.05); }
  </style>
  <script>
    function toggleAccordion(id) {
      const content = document.getElementById(id + '-content');
      const chevron = document.getElementById(id + '-chevron');
      
      if (content && chevron) {
        const isHidden = content.style.display === 'none';
        content.style.display = isHidden ? 'block' : 'none';
        chevron.textContent = isHidden ? '▲' : '▼';
      }
    }
  </script>
</head>
<body id="top">
  <!-- Header -->
  <header style="background-color: #051A53; padding: 1.5rem 2rem; border-bottom: 3px solid #577AFF;">
    <div style="max-width: 1400px; margin: 0 auto; display: flex; align-items: center; gap: 1rem;">
      <div style="width: 40px; height: 40px; background-color: #577AFF; border-radius: 8px; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
        <span style="color: white; font-weight: bold; font-size: 0.875rem;">ZM</span>
      </div>
      <div>
        <div style="color: white; font-size: 1.25rem; font-weight: 600;">AI Customer Advisory Board</div>
        <div style="color: #A1B4FF; font-size: 0.875rem;">The Zulu Method</div>
      </div>
    </div>
  </header>
  
  <!-- Main Content -->
  <div style="max-width: 1400px; margin: 0 auto; padding: 2rem;">
    ${htmlContent}
  </div>
  
  <!-- Footer -->
  <footer style="background-color: #051A53; padding: 1.5rem 2rem; margin-top: 3rem; border-top: 3px solid #577AFF;">
    <div style="max-width: 1400px; margin: 0 auto; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 1rem;">
      <div style="display: flex; align-items: center; gap: 1rem;">
        <div style="width: 32px; height: 32px; background-color: #577AFF; border-radius: 6px; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
          <span style="color: white; font-weight: bold; font-size: 0.75rem;">ZM</span>
        </div>
        <div style="color: white; font-size: 0.875rem; font-weight: 500;">The Zulu Method</div>
      </div>
      <div style="display: flex; align-items: center; gap: 1.5rem; flex-wrap: wrap;">
        <a href="https://thezulumethod.com" style="color: #A1B4FF; text-decoration: none; font-size: 0.875rem;">thezulumethod.com</a>
        <a href="mailto:customer@thezulumethod.com" style="color: #A1B4FF; text-decoration: none; font-size: 0.875rem;">customer@thezulumethod.com</a>
      </div>
    </div>
  </footer>
</body>
</html>`;
    
    // Generate filename with date and time
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    const filename = `The_Zulu_Method_CAB_Report_${year}${month}${day}_${hours}${minutes}${seconds}.html`;
    
    const element = document.createElement("a");
    const file = new Blob([fullHtml], {type: 'text/html'});
    element.href = URL.createObjectURL(file);
    element.download = filename;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  // Print / PDF
  const handlePrint = () => {
    if (isTrial && onUpgrade) {
      onUpgrade();
      return;
    }
    window.print();
  };

  // Parse Markdown into Sections based on H1 headers (# )
  // Only parse if we have actual content and not streaming
  // Wrap in try-catch to prevent crashes from malformed content
  // Use useMemo to prevent re-parsing on every render
  const sections: string[] = useMemo(() => {
    try {
      if (isStreaming || !safeReportContent || typeof safeReportContent !== 'string' || safeReportContent.trim().length === 0) {
        return [];
      }

      try {
        // Split by H1 headers (# ) - improved regex to handle various formats
        // Use positive lookahead to split before H1 headers but keep them in the section
        // Try multiple patterns to catch different markdown formats
        let splitResult: string[] = [];
        
        // Pattern 1: Standard H1 at start of line (with or without leading newline)
        const pattern1 = /(?=^# |\n# )/gm;
        splitResult = safeReportContent.split(pattern1);
        
        // If pattern1 didn't work well, try pattern2: More flexible
        if (splitResult.length <= 1 && safeReportContent.includes('#')) {
          // Pattern 2: Any # followed by space at start of line
          const pattern2 = /(?=^#\s)/gm;
          splitResult = safeReportContent.split(pattern2);
        }
        
        // Filter out empty sections and validate
        const filtered = splitResult.filter((s: unknown) => {
          try {
            if (!s || typeof s !== 'string') return false;
            const trimmed = s.trim();
            // Keep sections that have meaningful content (at least 10 chars)
            return trimmed.length >= 10;
          } catch {
            return false;
          }
        });
        
        // Debug: Log section count and previews
        console.log('📋 Parsed sections:', {
          totalSections: filtered.length,
          originalLength: safeReportContent.length,
          sectionPreviews: filtered.slice(0, 3).map((s: string, i: number) => ({
            index: i,
            length: s.length,
            preview: s.substring(0, 150),
            hasTable: s.includes('|'),
            hasH1: /^#\s/.test(s.trim())
          }))
        });
        
        // Fallback: If no sections found but content exists, treat entire content as one section
        if (filtered.length === 0 && safeReportContent.trim().length > 0) {
          console.warn('⚠️ No sections found after parsing, using entire content as one section');
          return [safeReportContent.trim()];
        }
        
        // Ensure we have at least one section
        if (filtered.length === 0) {
          console.warn('⚠️ All sections filtered out, using entire content as fallback');
          return safeReportContent.trim().length > 0 ? [safeReportContent.trim()] : [];
        }
        
        return filtered;
      } catch (parseError) {
        console.error('Error parsing report sections:', parseError);
        // If parsing fails, just show the whole report as one section
        if (safeReportContent && safeReportContent.trim().length > 0) {
          console.warn('⚠️ Section parsing failed, using entire content as fallback');
          return [safeReportContent.trim()];
        }
        return [];
      }
    } catch (outerError) {
      console.error('Error in sections parsing wrapper:', outerError);
      // Last resort: return the content as a single section if it exists
      if (safeReportContent && safeReportContent.trim().length > 0) {
        console.warn('⚠️ Outer parsing error, using entire content as fallback');
        return [safeReportContent.trim()];
      }
      return [];
    }
  }, [safeReportContent, isStreaming]);

  // Helper to determine section icon/color - UPDATED TO BLUE/CYAN PALETTE with specific mappings
  const getSectionStyle = (title: string) => {
    try {
      if (!title || typeof title !== 'string') {
        return { icon: FileText, color: 'text-[#383535] dark:text-[#d1d5db]', bg: 'bg-white dark:bg-[#111827]', border: 'border-[#EEF2FF] dark:border-[#374151]' };
      }
      
    const lower = title.toLowerCase();
    
    // Executive Dashboard
    if (lower.includes('executive') || lower.includes('dashboard')) {
        return { icon: LayoutDashboard, color: 'text-[#577AFF] dark:text-[#577AFF]', bg: 'bg-blue-50 dark:bg-blue-900/20', border: 'border-blue-100 dark:border-blue-800/50' };
    }
    // Key Research Findings & Facts
    if (lower.includes('key research') || lower.includes('findings')) {
        return { icon: Search, color: 'text-[#577AFF] dark:text-[#577AFF]', bg: 'bg-cyan-50 dark:bg-cyan-900/20', border: 'border-cyan-100 dark:border-cyan-800/50' };
    }
    // Deep Dive Analysis
    if (lower.includes('deep dive') || lower.includes('analysis')) {
          return { icon: FileText, color: 'text-[#31458F] dark:text-[#93C5FD]', bg: 'bg-indigo-50 dark:bg-indigo-900/20', border: 'border-indigo-100 dark:border-indigo-800/50' };
    }
    // The Roast & The Gold
    if (lower.includes('roast') || lower.includes('gold')) {
          return { icon: FileText, color: 'text-[#577AFF] dark:text-[#577AFF]', bg: 'bg-orange-50 dark:bg-orange-900/20', border: 'border-orange-100 dark:border-orange-800/50' };
    }
    // Raw Board Transcript
    if (lower.includes('transcript')) {
        return { icon: MessageSquare, color: 'text-[#577AFF] dark:text-[#577AFF]', bg: 'bg-purple-50 dark:bg-purple-900/20', border: 'border-purple-100 dark:border-purple-800/50' };
    }
    
    return { icon: FileText, color: 'text-[#383535] dark:text-[#d1d5db]', bg: 'bg-white dark:bg-[#111827]', border: 'border-[#EEF2FF] dark:border-[#374151]' };
    } catch (styleError) {
      console.error('Error in getSectionStyle:', styleError);
      return { icon: FileText, color: 'text-[#383535] dark:text-[#d1d5db]', bg: 'bg-white dark:bg-[#111827]', border: 'border-[#EEF2FF] dark:border-[#374151]' };
    }
  };

  const scrollToTop = () => {
    try {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (e) {
      console.error('Error scrolling to top:', e);
    }
  };


  // Safety check: Don't render if we don't have essential data or not ready
  // Only show loading message if actually streaming, otherwise wait for ready state
  if (isStreaming) {
    return (
      <div className="w-full max-w-[1400px] mx-auto p-2 md:p-6">
        <LoadingProgressBar userInput={userInput ?? null} reportLength={safeReportContent.length} />
      </div>
    );
  }
  
  // If not streaming but not ready yet, show a minimal loading state instead of blank screen
  if (!isReady || !safeReportContent || safeReportContent.trim().length === 0) {
    // Show a simple loading indicator instead of blank screen
    return (
      <div className="w-full max-w-[1400px] mx-auto p-2 md:p-6">
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-4 border-[#EEF2FF] border-t-[#577AFF] rounded-full animate-spin"></div>
          <span className="ml-4 text-[#595657]">Preparing report...</span>
        </div>
      </div>
    );
  }

  // Additional safety: Validate that if personaBreakdowns exists, it's properly structured
  if (safePersonaBreakdowns && safePersonaBreakdowns.length > 0) {
    const invalidPersonas = safePersonaBreakdowns.filter(p => {
      try {
        return !p || 
               !p.personaName || 
               typeof p.personaName !== 'string' ||
               !p.decisionMakingProcess ||
               typeof p.decisionMakingProcess !== 'object';
      } catch {
        return true;
      }
    });
    
    if (invalidPersonas.length > 0) {
      console.warn(`⚠️ Found ${invalidPersonas.length} invalid personas, filtering them out`);
      // Filter out invalid personas
      safePersonaBreakdowns.filter(p => {
        try {
          return p && 
                 p.personaName && 
                 typeof p.personaName === 'string' &&
                 p.decisionMakingProcess &&
                 typeof p.decisionMakingProcess === 'object';
        } catch {
          return false;
        }
      });
      // Update state if we filtered any out (but this won't work in render, so we'll handle it in validation)
    }
  }

  // Validate all data structures before rendering
  const validateData = () => {
    try {
      // Validate members
      if (!Array.isArray(safeMembers)) {
        console.error('❌ Members is not an array:', typeof safeMembers, safeMembers);
        return false;
      }
      
      // Validate ICP Profile if present
      if (safeIcpProfile) {
        if (typeof safeIcpProfile !== 'object') {
          console.error('❌ ICP Profile is not an object:', typeof safeIcpProfile);
          return false;
        }
        if (safeIcpProfile.titles && !Array.isArray(safeIcpProfile.titles)) {
          console.error('❌ ICP Profile titles is not an array:', typeof safeIcpProfile.titles);
          return false;
        }
        if (safeIcpProfile.useCaseFit && !Array.isArray(safeIcpProfile.useCaseFit)) {
          console.error('❌ ICP Profile useCaseFit is not an array:', typeof safeIcpProfile.useCaseFit);
          return false;
        }
        if (safeIcpProfile.signalsAndAttributes && !Array.isArray(safeIcpProfile.signalsAndAttributes)) {
          console.error('❌ ICP Profile signalsAndAttributes is not an array:', typeof safeIcpProfile.signalsAndAttributes);
          return false;
        }
      }
      
      // Validate Persona Breakdowns if present
      if (safePersonaBreakdowns) {
        if (!Array.isArray(safePersonaBreakdowns)) {
          console.error('❌ Persona Breakdowns is not an array:', typeof safePersonaBreakdowns);
          return false;
        }
        for (let idx = 0; idx < safePersonaBreakdowns.length; idx++) {
          const persona = safePersonaBreakdowns[idx];
          if (!persona || typeof persona !== 'object') {
            console.error(`❌ Persona ${idx} is not an object:`, typeof persona);
            return false;
          }
        }
      }
      
      return true;
    } catch (validationError) {
      console.error('❌ Error during data validation:', validationError);
      return false;
    }
  };

  if (!validateData()) {
    return (
      <div className="w-full max-w-[1400px] mx-auto p-2 md:p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <h2 className="text-xl font-bold text-red-800 mb-2">Data Validation Error</h2>
          <p className="text-red-700 mb-4">The report data structure is invalid. Please check the console for details.</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Reload Page
          </button>
        </div>
      </div>
    );
  }

  // Don't render until ready - Error Boundaries will catch any render errors
  if (!isReady) {
    return (
      <div className="w-full max-w-[1400px] mx-auto p-2 md:p-6">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-center">
          <p className="text-blue-700">
            {isStreaming ? 'Generating report...' : 'Validating report data...'}
          </p>
        </div>
      </div>
    );
  }

  // Final validation before render - ensure all critical data exists
  if (!safeReportContent || safeReportContent.trim().length === 0) {
    return (
      <div className="w-full max-w-[1400px] mx-auto p-2 md:p-6">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
          <p className="text-yellow-700">Report content is empty. Please try loading again.</p>
        </div>
      </div>
    );
  }

  if (!Array.isArray(safeMembers) || safeMembers.length === 0) {
    return (
      <div className="w-full max-w-[1400px] mx-auto p-2 md:p-6">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
          <p className="text-yellow-700">No board members found. Please try loading again.</p>
        </div>
      </div>
    );
  }

  // Ensure safePersonaBreakdowns is always an array
  const finalPersonaBreakdowns = Array.isArray(safePersonaBreakdowns) ? safePersonaBreakdowns : [];

  // Render the report - Error Boundaries will catch any errors
  return (
      <>
        {/* Add CSS for table styling - Executive Dashboard and other tables */}
        <style>{`
          .report-content table {
            width: 100%;
            border-collapse: collapse;
            margin: 1.5rem 0;
            border: 1px solid #EEF2FF;
          }
          .report-content table thead {
            background-color: #EEF2FF;
          }
          .report-content table th {
            padding: 1rem;
            text-align: left;
            font-weight: bold;
            color: #051A53;
            border: 1px solid #D5DDFF;
          }
          .report-content table tbody tr {
            border-bottom: 1px solid #EEF2FF;
          }
          .report-content table tbody tr:nth-child(odd) {
            background-color: white;
          }
          .report-content table tbody tr:nth-child(even) {
            background-color: #F9FAFD;
          }
          .report-content table td {
            padding: 1rem;
            border: 1px solid #EEF2FF;
            vertical-align: top;
            color: #595657;
            word-wrap: break-word;
            overflow-wrap: anywhere;
            word-break: break-word;
            max-width: 0;
          }
          .report-content table th {
            word-wrap: break-word;
            overflow-wrap: anywhere;
            word-break: break-word;
            max-width: 0;
          }
          .report-content table {
            table-layout: fixed;
            width: 100%;
          }
          .report-content table tbody td:first-child {
            font-weight: bold;
            color: #221E1F;
          }
          .report-content table tbody td:last-child {
            color: #577AFF;
            font-weight: normal;
          }
          /* Dark mode overrides for tables - HIGH SPECIFICITY */
          .dark .report-content table,
          .dark.report-content table {
            border-color: #374151 !important;
            background-color: #111827 !important;
          }
          .dark .report-content table thead,
          .dark.report-content table thead {
            background-color: #1a1f2e !important;
          }
          .dark .report-content table th,
          .dark.report-content table th {
            background-color: #1a1f2e !important;
            color: #93C5FD !important;
            border-color: #374151 !important;
          }
          .dark .report-content table tbody tr,
          .dark.report-content table tbody tr {
            border-bottom-color: #374151 !important;
          }
          .dark .report-content table tbody tr:nth-child(odd),
          .dark.report-content table tbody tr:nth-child(odd) {
            background-color: #111827 !important;
          }
          .dark .report-content table tbody tr:nth-child(even),
          .dark.report-content table tbody tr:nth-child(even) {
            background-color: #1a1f2e !important;
          }
          .dark .report-content table td,
          .dark.report-content table td {
            border-color: #374151 !important;
            color: #9ca3af !important;
            background-color: transparent !important;
          }
          .dark .report-content table tbody tr:nth-child(odd) td,
          .dark.report-content table tbody tr:nth-child(odd) td {
            background-color: #111827 !important;
            color: #9ca3af !important;
          }
          .dark .report-content table tbody tr:nth-child(even) td,
          .dark.report-content table tbody tr:nth-child(even) td {
            background-color: #1a1f2e !important;
            color: #9ca3af !important;
          }
          .dark .report-content table tbody td:first-child,
          .dark.report-content table tbody td:first-child {
            color: #f3f4f6 !important;
            font-weight: bold !important;
          }
          .dark .report-content table tbody tr:nth-child(odd) td:first-child,
          .dark.report-content table tbody tr:nth-child(odd) td:first-child {
            background-color: #111827 !important;
            color: #f3f4f6 !important;
          }
          .dark .report-content table tbody tr:nth-child(even) td:first-child,
          .dark.report-content table tbody tr:nth-child(even) td:first-child {
            background-color: #1a1f2e !important;
            color: #f3f4f6 !important;
          }
          .dark .report-content table tbody td:last-child,
          .dark.report-content table tbody td:last-child {
            color: #93C5FD !important;
          }
          .dark .report-content table tbody tr:nth-child(odd) td:last-child,
          .dark.report-content table tbody tr:nth-child(odd) td:last-child {
            background-color: #111827 !important;
            color: #93C5FD !important;
          }
          .dark .report-content table tbody tr:nth-child(even) td:last-child,
          .dark.report-content table tbody tr:nth-child(even) td:last-child {
            background-color: #1a1f2e !important;
            color: #93C5FD !important;
          }
          /* Ensure links in tables are visible in dark mode */
          .dark .report-content table td a,
          .dark.report-content table td a {
            color: #93C5FD !important;
          }
          .dark .report-content table tbody tr:nth-child(odd) td a,
          .dark.report-content table tbody tr:nth-child(odd) td a {
            color: #93C5FD !important;
          }
          .dark .report-content table tbody tr:nth-child(even) td a,
          .dark.report-content table tbody tr:nth-child(even) td a {
            color: #93C5FD !important;
          }
          /* Global dark mode table fixes - catch ALL tables */
          .dark table,
          .dark table tbody tr,
          .dark table tbody tr td {
            background-color: transparent !important;
          }
          .dark table tbody tr:nth-child(odd),
          .dark table tbody tr:nth-child(odd) td {
            background-color: #111827 !important;
            color: #9ca3af !important;
          }
          .dark table tbody tr:nth-child(even),
          .dark table tbody tr:nth-child(even) td {
            background-color: #1a1f2e !important;
            color: #9ca3af !important;
          }
          .dark table thead,
          .dark table th {
            background-color: #1a1f2e !important;
            color: #93C5FD !important;
          }
          .dark table td {
            border-color: #374151 !important;
            color: #9ca3af !important;
          }
          .dark table tbody td:first-child {
            color: #f3f4f6 !important;
            font-weight: bold !important;
          }
          .dark table tbody tr:nth-child(odd) td:first-child {
            background-color: #111827 !important;
            color: #f3f4f6 !important;
          }
          .dark table tbody tr:nth-child(even) td:first-child {
            background-color: #1a1f2e !important;
            color: #f3f4f6 !important;
          }
          .dark table td a {
            color: #93C5FD !important;
          }
          
          /* Print styles for window.print() */
          @media print {
            @page {
              margin: 0.75in;
            }
            body { 
              background: white !important;
            }
            .no-print { 
              display: none !important; 
            }
            
            /* Ensure tables print correctly */
            table {
              page-break-inside: auto !important;
            }
            tr {
              page-break-inside: avoid !important;
              page-break-after: auto !important;
            }
            thead {
              display: table-header-group !important;
            }
            tfoot {
              display: table-footer-group !important;
            }
            
            /* Print header */
            body::before {
              content: 'The Zulu Method - AI Customer Advisory Board';
              display: block;
              background-color: #051A53;
              color: white;
              padding: 0.75rem 1rem;
              margin-bottom: 1rem;
              border-bottom: 3px solid #577AFF;
              font-weight: 600;
              font-size: 0.875rem;
            }
            
            /* Print footer */
            body::after {
              content: 'The Zulu Method | thezulumethod.com | customer@thezulumethod.com';
              display: block;
              background-color: #051A53;
              color: #A1B4FF;
              padding: 0.75rem 1rem;
              margin-top: 2rem;
              text-align: center;
              font-size: 0.75rem;
              border-top: 3px solid #577AFF;
            }
          }
        `}</style>
      <div className="w-full max-w-[1400px] mx-auto p-2 md:p-6 animate-in fade-in duration-500 print:p-0 print:max-w-none report-content">
      
      {/* Report Sections - Horizontal Cards Layout */}
      <div className="mb-6 md:mb-8 bg-[#F9FAFD] dark:bg-[#1a1f2e] rounded-xl p-4 md:p-6 border border-[#EEF2FF] dark:border-[#374151]">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Board Roster Card */}
          <SectionErrorBoundary sectionName="Board Roster">
            {safeMembers.length > 0 ? (
              <div className="bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200 dark:border-blue-800/50 shadow-sm dark:shadow-[0_0_10px_rgba(87,122,255,0.2)] overflow-hidden cursor-pointer hover:shadow-md dark:hover:shadow-[0_0_15px_rgba(87,122,255,0.3)] transition-shadow"
                onClick={() => setShowMatrix(!showMatrix)}
              >
                <div className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center">
                      <Users className="w-5 h-5 text-[#577AFF] dark:text-[#93C5FD]" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-[#221E1F] dark:text-[#f3f4f6] text-sm">Board Roster</h3>
                      <p className="text-xs text-[#595657] dark:text-[#9ca3af]">{safeMembers.length} Members</p>
                    </div>
                  </div>
                  {showMatrix ? <ChevronUp className="w-4 h-4 text-[#595657] dark:text-[#9ca3af]" /> : <ChevronDown className="w-4 h-4 text-[#595657] dark:text-[#9ca3af]" />}
                </div>
              </div>
            ) : (
              <div className="bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200 dark:border-blue-800/50 shadow-sm p-4 flex items-center gap-3">
                <div className="w-5 h-5 border-2 border-[#577AFF] border-t-transparent rounded-full animate-spin"></div>
                <span className="text-sm text-[#595657] dark:text-[#9ca3af]">Details loading...</span>
              </div>
            )}
          </SectionErrorBoundary>

          {/* Persona Breakdowns Card */}
          <SectionErrorBoundary sectionName="Persona Breakdowns">
            {Array.isArray(safePersonaBreakdowns) && safePersonaBreakdowns.length > 0 ? (
              <div className="bg-indigo-50 dark:bg-indigo-950/30 rounded-lg border border-indigo-200 dark:border-indigo-800/50 shadow-sm dark:shadow-[0_0_10px_rgba(87,122,255,0.2)] overflow-hidden cursor-pointer hover:shadow-md dark:hover:shadow-[0_0_15px_rgba(87,122,255,0.3)] transition-shadow"
                onClick={() => setShowPersonaBreakdowns(!showPersonaBreakdowns)}
              >
                <div className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-indigo-100 dark:bg-indigo-900/20 flex items-center justify-center">
                      <UserCircle className="w-5 h-5 text-[#577AFF] dark:text-[#93C5FD]" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-[#221E1F] dark:text-[#f3f4f6] text-sm">Persona Breakdowns</h3>
                      <p className="text-xs text-[#595657] dark:text-[#9ca3af]">{finalPersonaBreakdowns.slice(0, 5).length} Personas</p>
                    </div>
                  </div>
                  {showPersonaBreakdowns ? <ChevronUp className="w-4 h-4 text-[#595657] dark:text-[#9ca3af]" /> : <ChevronDown className="w-4 h-4 text-[#595657] dark:text-[#9ca3af]" />}
                </div>
              </div>
            ) : (
              <div className="bg-indigo-50 dark:bg-indigo-950/30 rounded-lg border border-indigo-200 dark:border-indigo-800/50 shadow-sm p-4 flex items-center gap-3">
                <div className="w-5 h-5 border-2 border-[#577AFF] border-t-transparent rounded-full animate-spin"></div>
                <span className="text-sm text-[#595657] dark:text-[#9ca3af]">Details loading...</span>
              </div>
            )}
          </SectionErrorBoundary>

          {/* ICP Profile Card */}
          <SectionErrorBoundary sectionName="ICP Profile">
            {safeIcpProfile ? (
              <div className="bg-cyan-50 dark:bg-cyan-950/30 rounded-lg border border-cyan-200 dark:border-cyan-800/50 shadow-sm dark:shadow-[0_0_10px_rgba(87,122,255,0.2)] overflow-hidden cursor-pointer hover:shadow-md dark:hover:shadow-[0_0_15px_rgba(87,122,255,0.3)] transition-shadow"
                onClick={() => setShowICPProfile(!showICPProfile)}
              >
                <div className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-cyan-100 dark:bg-cyan-900/20 flex items-center justify-center">
                      <Target className="w-5 h-5 text-[#577AFF] dark:text-[#93C5FD]" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-[#221E1F] dark:text-[#f3f4f6] text-sm">ICP Profile</h3>
                      <p className="text-xs text-[#595657] dark:text-[#9ca3af]">Report</p>
                    </div>
                  </div>
                  {showICPProfile ? <ChevronUp className="w-4 h-4 text-[#595657] dark:text-[#9ca3af]" /> : <ChevronDown className="w-4 h-4 text-[#595657] dark:text-[#9ca3af]" />}
                </div>
              </div>
            ) : (
              <div className="bg-cyan-50 dark:bg-cyan-950/30 rounded-lg border border-cyan-200 dark:border-cyan-800/50 shadow-sm p-4 flex items-center gap-3">
                <div className="w-5 h-5 border-2 border-[#577AFF] border-t-transparent rounded-full animate-spin"></div>
                <span className="text-sm text-[#595657] dark:text-[#9ca3af]">Details loading...</span>
              </div>
            )}
          </SectionErrorBoundary>
        </div>
      </div>

      {/* 1. Board Member Matrix - Expanded Content */}
        <SectionErrorBoundary sectionName="Board Member Matrix">
          {safeMembers.length > 0 && showMatrix && (
      <div className="mb-6 md:mb-8 bg-white dark:bg-[#111827] rounded-lg border border-[#EEF2FF] dark:border-[#374151] shadow-sm dark:shadow-[0_0_15px_rgba(87,122,255,0.2)] overflow-hidden print:border print:shadow-none">
        <div className="border-t border-[#EEF2FF] dark:border-[#374151] overflow-x-auto bg-white dark:bg-[#111827]">
            <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-[#F9FAFD] dark:bg-[#1a1f2e] uppercase font-bold">
                <tr>
                <th className="px-4 py-2 text-[#383535] dark:text-[#d1d5db] border-b border-[#EEF2FF] dark:border-[#374151]">Name</th>
                <th className="px-4 py-2 text-[#383535] dark:text-[#d1d5db] border-b border-[#EEF2FF] dark:border-[#374151]">Role</th>
                <th className="px-4 py-2 text-[#383535] dark:text-[#d1d5db] border-b border-[#EEF2FF] dark:border-[#374151]">Company</th>
                <th className="px-4 py-2 text-[#383535] dark:text-[#d1d5db] border-b border-[#EEF2FF] dark:border-[#374151]">Archetype</th>
                </tr>
            </thead>
            <tbody>
                    {safeMembers.map((m, idx) => {
                      try {
                        if (!m || typeof m !== 'object') return null;
                        const isEven = idx % 2 === 0;
                        return (
                          <tr 
                            key={m.id || `member-${idx}`} 
                            className={`border-b border-[#EEF2FF] dark:border-[#374151] ${
                              isEven 
                                ? 'bg-white dark:bg-[#111827]' 
                                : 'bg-[#F9FAFD] dark:bg-[#1a1f2e]'
                            } hover:bg-[#F9FAFD] dark:hover:bg-[#1a1f2e]`}
                          >
                              <td className={`px-4 py-2 font-bold ${
                                isEven 
                                  ? 'text-[#221E1F] dark:text-[#f3f4f6]' 
                                  : 'text-[#221E1F] dark:text-[#f3f4f6]'
                              }`}>{m.name || 'N/A'}</td>
                              <td className={`px-4 py-2 ${
                                isEven 
                                  ? 'text-[#595657] dark:text-[#9ca3af]' 
                                  : 'text-[#595657] dark:text-[#9ca3af]'
                              }`}>{m.role || 'N/A'}</td>
                              <td className={`px-4 py-2 ${
                                isEven 
                                  ? 'text-[#595657] dark:text-[#9ca3af]' 
                                  : 'text-[#595657] dark:text-[#9ca3af]'
                              }`}>{m.companyType || 'N/A'}</td>
                              <td className={`px-4 py-2 ${
                                isEven 
                                  ? 'text-[#577AFF] dark:text-[#93C5FD]' 
                                  : 'text-[#577AFF] dark:text-[#93C5FD]'
                              }`}>{m.personalityArchetype || 'N/A'}</td>
                    </tr>
                        );
                      } catch (e) {
                        console.error('Error rendering member:', e);
                        return null;
                      }
                    })}
            </tbody>
            </table>
        </div>
      </div>
          )}
        </SectionErrorBoundary>

      {/* Persona Breakdowns Report - Expanded Content */}
        <SectionErrorBoundary sectionName="Persona Breakdowns">
          {Array.isArray(safePersonaBreakdowns) && safePersonaBreakdowns.length > 0 && showPersonaBreakdowns && (
        <div className="mb-6 md:mb-8 bg-white dark:bg-[#111827] rounded-lg border border-[#EEF2FF] dark:border-[#374151] shadow-sm dark:shadow-[0_0_15px_rgba(87,122,255,0.2)] overflow-hidden print:border print:shadow-none">
          <div className="border-t border-[#EEF2FF] dark:border-[#374151] p-4 md:p-6 dark:bg-[#111827]">
            {/* Tabbed Navigation */}
            <div className="mb-6 border-b border-[#EEF2FF] dark:border-[#374151] no-print">
              <div className="flex flex-wrap gap-2">
                {finalPersonaBreakdowns.slice(0, 5).map((persona, tabIdx) => {
                  try {
                    if (!persona || typeof persona !== 'object') return null;
                    return (
                  <button
                    key={tabIdx}
                    onClick={() => {
                          try {
                      setActivePersonaTab(tabIdx);
                      document.getElementById(`persona-${tabIdx}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                          } catch (e) {
                            console.error('Error scrolling to persona:', e);
                          }
                    }}
                    className={`px-4 py-2 text-sm font-semibold rounded-t-lg transition-colors ${
                      activePersonaTab === tabIdx
                        ? 'bg-[#577AFF] text-white border-b-2 border-[#577AFF]'
                        : 'bg-[#F9FAFD] dark:bg-[#1a1f2e] text-[#595657] dark:text-[#9ca3af] hover:bg-[#EEF2FF] dark:hover:bg-[#374151]'
                    }`}
                  >
                        {persona.personaTitle || persona.personaName || 'Persona'}
                  </button>
                    );
                  } catch (e) {
                    console.error('Error rendering persona tab:', e);
                    return null;
                  }
                })}
              </div>
            </div>

            {/* Show only active persona instead of all */}
            {finalPersonaBreakdowns.slice(0, 5).map((persona, idx) => {
              if (idx !== activePersonaTab) return null;
              try {
                if (!persona || typeof persona !== 'object') return null;
                // Generate avatar initials and color
                
                return (
                <div key={idx} id={`persona-${idx}`} className="bg-white dark:bg-[#111827] rounded-lg p-6 border border-[#EEF2FF] dark:border-[#374151] shadow-sm dark:shadow-[0_0_15px_rgba(87,122,255,0.2)]">
                  {/* Header with Avatar - Matching PDF example */}
                  <div className="mb-6 flex items-start gap-4">
                    {/* Avatar */}
                    <div className="flex-shrink-0">
                      {(() => {
                        try {
                          const name = persona.personaName || 'Persona';
                          const initials = name.split(' ').map((n: string) => n[0] || '').join('').substring(0, 2).toUpperCase() || 'P';
                        const avatarColors = [
                          'from-purple-400 to-purple-600',
                          'from-emerald-400 to-emerald-600',
                          'from-amber-400 to-amber-600',
                          'from-rose-400 to-rose-600',
                          'from-teal-400 to-teal-600',
                        ];
                        const avatarColor = avatarColors[idx % avatarColors.length];
                        return (
                          <div className={`w-20 h-20 rounded-full bg-gradient-to-br ${avatarColor} flex items-center justify-center text-white text-2xl font-bold shadow-md border-2 border-white dark:border-[#111827] ring-1 ring-[#EEF2FF] dark:ring-[#374151]`}>
                            {initials}
                          </div>
                        );
                        } catch (e) {
                          console.error('Error rendering avatar:', e);
                          return <div className="w-20 h-20 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center text-white text-2xl font-bold">P</div>;
                        }
                      })()}
                    </div>
                    {/* Header Text */}
                    <div className="flex-1">
                      <h2 className="text-3xl font-bold text-[#221E1F] dark:text-[#f3f4f6] mb-2">{persona.personaName || 'Persona'}</h2>
                      <p className="text-xl font-bold text-[#221E1F] dark:text-[#f3f4f6] mb-1">{persona.personaTitle || 'N/A'}</p>
                      <p className="text-base font-semibold text-[#221E1F] dark:text-[#9ca3af] italic">{persona.buyerType || 'N/A'}</p>
                    </div>
                  </div>

                  <div className="space-y-5 text-[#595657] dark:text-[#9ca3af]">
                    {/* Age */}
                    <div>
                      <p className="font-semibold text-[#221E1F] dark:text-[#f3f4f6] mb-1"><strong>Age:</strong> {persona.ageRange}</p>
                    </div>

                    {/* Preferred Communication Channels - Moved between Age and Titles */}
                    {persona.preferredCommunicationChannels && Array.isArray(persona.preferredCommunicationChannels) && (
                    <div>
                      <p className="font-semibold text-[#221E1F] dark:text-[#f3f4f6] mb-1"><strong>Preferred Communication Channel(s):</strong></p>
                      <ul className="list-none space-y-0.5 mt-1">
                        {persona.preferredCommunicationChannels.map((channel, chIdx) => (
                            <li key={chIdx} className="pl-0">• {channel || 'N/A'}</li>
                        ))}
                      </ul>
                    </div>
                    )}

                    {/* Titles */}
                    {persona.titles && Array.isArray(persona.titles) && (
                    <div>
                      <p className="font-semibold text-[#221E1F] dark:text-[#f3f4f6] mb-1"><strong>Title(s):</strong></p>
                      <ul className="list-none space-y-0.5 mt-1">
                        {persona.titles.map((title, tIdx) => (
                            <li key={tIdx} className="pl-0">• {title || 'N/A'}</li>
                        ))}
                      </ul>
                    </div>
                    )}

                    {/* Other Relevant Info */}
                    {persona.otherRelevantInfo && Array.isArray(persona.otherRelevantInfo) && persona.otherRelevantInfo.length > 0 && (
                      <div>
                        <p className="font-semibold text-[#221E1F] dark:text-[#f3f4f6] mb-1"><strong>Other Relevant Info:</strong></p>
                        <ul className="list-none space-y-0.5 mt-1">
                          {persona.otherRelevantInfo.map((info, infoIdx) => (
                            <li key={infoIdx} className="pl-0">• {info || 'N/A'}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Attributes - Checkboxes matching PDF */}
                    {persona.attributes && Array.isArray(persona.attributes) && (
                    <div>
                      <p className="font-semibold text-[#221E1F] dark:text-[#f3f4f6] mb-2"><strong>Attributes</strong></p>
                      <div className="space-y-1">
                        {persona.attributes.map((attr, attrIdx) => (
                          <label key={attrIdx} className="flex items-center gap-2 cursor-default">
                            <input type="checkbox" checked readOnly className="w-4 h-4 text-[#577AFF] rounded border-[#D5DDFF] dark:border-[#374151] focus:ring-[#577AFF] bg-white dark:bg-[#111827]" />
                              <span className="text-[#221E1F] dark:text-[#f3f4f6]">{attr || 'N/A'}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                    )}

                    {/* Jobs to be Done */}
                    {persona.jobsToBeDone && Array.isArray(persona.jobsToBeDone) && (
                    <div>
                      <h3 className="font-bold text-lg text-[#221E1F] dark:text-[#f3f4f6] mb-2">Jobs to be Done</h3>
                      <ul className="list-none space-y-2 mt-2">
                        {persona.jobsToBeDone.map((job, jobIdx) => (
                            <li key={jobIdx} className="leading-relaxed pl-0">• {job || 'N/A'}</li>
                        ))}
                      </ul>
                    </div>
                    )}

                    {/* Decision-Making Process */}
                    {persona.decisionMakingProcess && typeof persona.decisionMakingProcess === 'object' && (
                    <div>
                      <h3 className="font-bold text-lg text-[#221E1F] dark:text-[#f3f4f6] mb-3">Decision-Making Process</h3>
                      <div className="space-y-4">
                        {/* Research */}
                          {persona.decisionMakingProcess.research && typeof persona.decisionMakingProcess.research === 'object' && !Array.isArray(persona.decisionMakingProcess.research) && (
                        <div>
                          <h4 className="font-bold text-base text-[#221E1F] dark:text-[#f3f4f6] mb-1">1. Research</h4>
                              <p className="text-sm text-[#595657] dark:text-[#9ca3af] italic mb-2">{persona.decisionMakingProcess.research.description || 'N/A'}</p>
                              {persona.decisionMakingProcess.research.sources && Array.isArray(persona.decisionMakingProcess.research.sources) && (
                          <ul className="list-none space-y-0.5">
                            {persona.decisionMakingProcess.research.sources.map((source, sIdx) => (
                                    <li key={sIdx} className="pl-0">• {source || 'N/A'}</li>
                            ))}
                          </ul>
                              )}
                        </div>
                          )}

                        {/* Evaluation */}
                          {persona.decisionMakingProcess.evaluation && typeof persona.decisionMakingProcess.evaluation === 'object' && !Array.isArray(persona.decisionMakingProcess.evaluation) && (
                        <div>
                          <h4 className="font-bold text-base text-[#221E1F] dark:text-[#f3f4f6] mb-1">2. Evaluation</h4>
                              <p className="text-sm text-[#595657] dark:text-[#9ca3af] italic mb-2">{persona.decisionMakingProcess.evaluation.description || 'N/A'}</p>
                              {persona.decisionMakingProcess.evaluation.factors && Array.isArray(persona.decisionMakingProcess.evaluation.factors) && (
                          <ul className="list-none space-y-0.5">
                            {persona.decisionMakingProcess.evaluation.factors.map((factor, fIdx) => (
                                    <li key={fIdx} className="pl-0">• {factor || 'N/A'}</li>
                            ))}
                          </ul>
                              )}
                        </div>
                          )}

                        {/* Purchase */}
                          {persona.decisionMakingProcess.purchase && typeof persona.decisionMakingProcess.purchase === 'object' && !Array.isArray(persona.decisionMakingProcess.purchase) && (
                        <div>
                          <h4 className="font-bold text-base text-[#221E1F] dark:text-[#f3f4f6] mb-1">3. Purchase</h4>
                              <p className="text-sm text-[#595657] dark:text-[#9ca3af] italic mb-2">{persona.decisionMakingProcess.purchase.description || 'N/A'}</p>
                          <div className="space-y-2">
                                {persona.decisionMakingProcess.purchase.purchaseFactors && Array.isArray(persona.decisionMakingProcess.purchase.purchaseFactors) && (
                            <div>
                              <p className="text-sm font-medium text-[#221E1F] dark:text-[#f3f4f6] mb-1">What convinces me:</p>
                              <ul className="list-none space-y-0.5">
                                {persona.decisionMakingProcess.purchase.purchaseFactors.map((factor, pfIdx) => (
                                        <li key={pfIdx} className="pl-0">• {factor || 'N/A'}</li>
                                ))}
                              </ul>
                            </div>
                                )}
                                {persona.decisionMakingProcess.purchase.hesitations && Array.isArray(persona.decisionMakingProcess.purchase.hesitations) && (
                            <div>
                              <p className="text-sm font-medium text-[#221E1F] dark:text-[#f3f4f6] mb-1">What makes me hesitate:</p>
                              <ul className="list-none space-y-0.5">
                                {persona.decisionMakingProcess.purchase.hesitations.map((hesitation, hIdx) => (
                                        <li key={hIdx} className="pl-0">• {hesitation || 'N/A'}</li>
                                ))}
                              </ul>
                            </div>
                                )}
                          </div>
                        </div>
                          )}
                      </div>
                    </div>
                    )}

                    {/* Challenges */}
                    {persona.challenges && Array.isArray(persona.challenges) && (
                    <div>
                      <h3 className="font-bold text-lg text-[#221E1F] dark:text-[#f3f4f6] mb-2">Challenges</h3>
                      <ul className="list-none space-y-2 mt-2">
                        {persona.challenges.map((challenge, cIdx) => (
                            <li key={cIdx} className="leading-relaxed pl-0">• {challenge || 'N/A'}</li>
                        ))}
                      </ul>
                    </div>
                    )}
                  </div>

                  {/* Back to Top Link */}
                  <div className="mt-6 pt-4 border-t border-[#EEF2FF] flex justify-end no-print">
                    <button 
                      onClick={() => {
                        try {
                          scrollToTop();
                        } catch (e) {
                          console.error('Error scrolling to top:', e);
                        }
                      }}
                      className="flex items-center gap-1 text-xs font-bold text-[#595657] hover:text-[#577AFF] transition-colors uppercase tracking-wider"
                    >
                      Back to top
                      <ArrowUp className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              );
                } catch (personaError) {
                  console.error(`Error rendering persona ${idx}:`, personaError);
                  return (
                    <div key={idx} className="bg-white dark:bg-[#111827] rounded-lg border border-[#EEF2FF] dark:border-[#374151] p-6">
                      <h3 className="text-lg font-bold text-[#221E1F] dark:text-[#f3f4f6] mb-2">Persona Information</h3>
                      <p className="text-[#595657] dark:text-[#9ca3af]">Unable to display persona details due to a rendering error.</p>
                    </div>
                  );
                }
              })}

              {/* Back to Top Link */}
              <div className="mt-8 pt-6 border-t border-[#EEF2FF] dark:border-[#374151] flex justify-end no-print">
                <button 
                  onClick={scrollToTop}
                  className="flex items-center gap-1 text-xs font-bold text-[#595657] dark:text-[#9ca3af] hover:text-[#577AFF] dark:hover:text-[#93C5FD] transition-colors uppercase tracking-wider"
                >
                  Back to top
                  <ArrowUp className="w-3 h-3" />
                </button>
              </div>
          </div>
        </div>
          )}
        </SectionErrorBoundary>

      {/* ICP Profile Report - Expanded Content */}
        <SectionErrorBoundary sectionName="ICP Profile">
          {safeIcpProfile && showICPProfile && (
        <div className="mb-6 md:mb-8 bg-white dark:bg-[#111827] rounded-lg border border-[#EEF2FF] dark:border-[#374151] shadow-sm dark:shadow-[0_0_15px_rgba(87,122,255,0.2)] overflow-hidden print:border print:shadow-none">
          <div className="border-t border-[#EEF2FF] dark:border-[#374151] p-4 md:p-6 bg-white dark:bg-[#111827]">
            <div className="space-y-8">
              {/* Titles - Moved to top */}
              {safeIcpProfile.titles && Array.isArray(safeIcpProfile.titles) && safeIcpProfile.titles.length > 0 && (
              <div>
                <h2 className="text-xl font-bold text-[#221E1F] dark:text-[#f3f4f6] mb-4 pb-2 border-b-2 border-[#EEF2FF] dark:border-[#374151]">Titles</h2>
                <div className="space-y-6">
                  {safeIcpProfile.titles.map((titleGroup: { department?: string; roles?: string[] }, idx: number) => {
                    try {
                      if (!titleGroup || typeof titleGroup !== 'object') return null;
                      return (
                    <div key={idx}>
                          <h3 className="font-bold text-[#221E1F] dark:text-[#f3f4f6] mb-3 text-base">{titleGroup.department || 'N/A'}</h3>
                      <ul className="list-none space-y-1 text-[#595657] dark:text-[#9ca3af]">
                            {Array.isArray(titleGroup.roles) ? titleGroup.roles.map((role: string, roleIdx: number) => (
                              <li key={roleIdx} className="pl-0">• {role || 'N/A'}</li>
                            )) : null}
                      </ul>
                    </div>
                      );
                    } catch (e) {
                      console.error('Error rendering title group:', e);
                      return null;
                    }
                  })}
                </div>
              </div>
              )}

              {/* Use Case Fit */}
              {safeIcpProfile.useCaseFit && Array.isArray(safeIcpProfile.useCaseFit) && (
              <div>
                <h2 className="text-xl font-bold text-[#221E1F] dark:text-[#f3f4f6] mb-4 pb-2 border-b-2 border-[#EEF2FF] dark:border-[#374151]">Use Case Fit</h2>
                <ul className="list-none space-y-2 text-[#595657] dark:text-[#9ca3af]">
                    {safeIcpProfile.useCaseFit.map((useCase: string, idx: number) => (
                      <li key={idx} className="leading-relaxed pl-0">• {useCase || 'N/A'}</li>
                  ))}
                </ul>
              </div>
              )}

              {/* Signals & Attributes */}
              {safeIcpProfile.signalsAndAttributes && Array.isArray(safeIcpProfile.signalsAndAttributes) && (
              <div>
                <h2 className="text-xl font-bold text-[#221E1F] dark:text-[#f3f4f6] mb-4 pb-2 border-b-2 border-[#EEF2FF] dark:border-[#374151]">Signals & Attributes</h2>
                <div className="space-y-4">
                    {safeIcpProfile.signalsAndAttributes.map((signal: { category?: string; description?: string; triggerQuestion?: string }, idx: number) => {
                      try {
                        if (!signal || typeof signal !== 'object') return null;
                        return (
                    <div key={idx} className="border-l-4 border-[#577AFF] dark:border-[#577AFF] pl-4 py-2">
                            <h3 className="font-bold text-[#221E1F] dark:text-[#f3f4f6] mb-2 text-base">{signal.category || 'N/A'}</h3>
                            <p className="leading-relaxed mb-1 text-[#595657] dark:text-[#9ca3af]">{signal.description || 'N/A'}</p>
                      {signal.triggerQuestion && (
                        <p className="text-[#577AFF] dark:text-[#93C5FD] italic text-sm mt-1">"{signal.triggerQuestion}"</p>
                      )}
                    </div>
                        );
                      } catch (e) {
                        console.error('Error rendering signal:', e);
                        return null;
                      }
                    })}
                </div>
              </div>
              )}

              {/* Psychographics */}
              {safeIcpProfile.psychographics && Array.isArray(safeIcpProfile.psychographics) && safeIcpProfile.psychographics.length > 0 && (
              <div>
                <h2 className="text-xl font-bold text-[#221E1F] dark:text-[#f3f4f6] mb-4 pb-2 border-b-2 border-[#EEF2FF] dark:border-[#374151]">Psychographics</h2>
                <ul className="list-none space-y-2 text-[#595657] dark:text-[#9ca3af]">
                    {safeIcpProfile.psychographics.map((item: string, idx: number) => (
                      <li key={idx} className="leading-relaxed pl-0">• {item || 'N/A'}</li>
                  ))}
                </ul>
              </div>
              )}

              {/* Buying Triggers */}
              {safeIcpProfile.buyingTriggers && Array.isArray(safeIcpProfile.buyingTriggers) && safeIcpProfile.buyingTriggers.length > 0 && (
              <div>
                <h2 className="text-xl font-bold text-[#221E1F] dark:text-[#f3f4f6] mb-4 pb-2 border-b-2 border-[#EEF2FF] dark:border-[#374151]">Buying Triggers</h2>
                <ul className="list-none space-y-2 text-[#595657] dark:text-[#9ca3af]">
                    {safeIcpProfile.buyingTriggers.map((item: string, idx: number) => (
                      <li key={idx} className="leading-relaxed pl-0">• {item || 'N/A'}</li>
                  ))}
                </ul>
              </div>
              )}

              {/* Language Patterns */}
              {safeIcpProfile.languagePatterns && Array.isArray(safeIcpProfile.languagePatterns) && safeIcpProfile.languagePatterns.length > 0 && (
              <div>
                <h2 className="text-xl font-bold text-[#221E1F] dark:text-[#f3f4f6] mb-4 pb-2 border-b-2 border-[#EEF2FF] dark:border-[#374151]">Language Patterns</h2>
                <ul className="list-none space-y-2 text-[#595657] dark:text-[#9ca3af]">
                    {safeIcpProfile.languagePatterns.map((item: string, idx: number) => (
                      <li key={idx} className="leading-relaxed pl-0">• {item || 'N/A'}</li>
                  ))}
                </ul>
              </div>
              )}

              {/* Narrative Frames */}
              {safeIcpProfile.narrativeFrames && Array.isArray(safeIcpProfile.narrativeFrames) && safeIcpProfile.narrativeFrames.length > 0 && (
              <div>
                <h2 className="text-xl font-bold text-[#221E1F] dark:text-[#f3f4f6] mb-4 pb-2 border-b-2 border-[#EEF2FF] dark:border-[#374151]">Narrative Frames</h2>
                <ul className="list-none space-y-2 text-[#595657] dark:text-[#9ca3af]">
                    {safeIcpProfile.narrativeFrames.map((item: string, idx: number) => (
                      <li key={idx} className="leading-relaxed pl-0">• {item || 'N/A'}</li>
                  ))}
                </ul>
              </div>
              )}

              {/* Objections */}
              {safeIcpProfile.objections && Array.isArray(safeIcpProfile.objections) && safeIcpProfile.objections.length > 0 && (
              <div>
                <h2 className="text-xl font-bold text-[#221E1F] dark:text-[#f3f4f6] mb-4 pb-2 border-b-2 border-[#EEF2FF] dark:border-[#374151]">Objections</h2>
                <ul className="list-none space-y-2 text-[#595657] dark:text-[#9ca3af]">
                    {safeIcpProfile.objections.map((item: string, idx: number) => (
                      <li key={idx} className="leading-relaxed pl-0">• {item || 'N/A'}</li>
                  ))}
                </ul>
              </div>
              )}

              {/* Copy Angles */}
              {safeIcpProfile.copyAngles && Array.isArray(safeIcpProfile.copyAngles) && safeIcpProfile.copyAngles.length > 0 && (
              <div>
                <h2 className="text-xl font-bold text-[#221E1F] dark:text-[#f3f4f6] mb-4 pb-2 border-b-2 border-[#EEF2FF] dark:border-[#374151]">Copy Angles</h2>
                <ul className="list-none space-y-2 text-[#595657] dark:text-[#9ca3af]">
                    {safeIcpProfile.copyAngles.map((item: string, idx: number) => (
                      <li key={idx} className="leading-relaxed pl-0">• {item || 'N/A'}</li>
                  ))}
                </ul>
              </div>
              )}

              {/* Lead-Specific Behavioral Patterns */}
              {safeIcpProfile.leadBehavioralPatterns && Array.isArray(safeIcpProfile.leadBehavioralPatterns) && safeIcpProfile.leadBehavioralPatterns.length > 0 && (
              <div>
                <h2 className="text-xl font-bold text-[#221E1F] dark:text-[#f3f4f6] mb-4 pb-2 border-b-2 border-[#EEF2FF] dark:border-[#374151]">Lead-Specific Behavioral Patterns</h2>
                <ul className="list-none space-y-2 text-[#595657] dark:text-[#9ca3af]">
                    {safeIcpProfile.leadBehavioralPatterns.map((item: string, idx: number) => (
                      <li key={idx} className="leading-relaxed pl-0">• {item || 'N/A'}</li>
                  ))}
                </ul>
              </div>
              )}
            </div>
          </div>
        </div>
      )}
        </SectionErrorBoundary>

      {/* Industry Information Section Removed */}

      {/* 2. Sticky Header Controls */}
      <div className="sticky top-[72px] md:top-[88px] z-20 bg-blue-100 dark:bg-[#1a1f2e] border border-blue-200 dark:border-[#374151] rounded-lg shadow-sm dark:shadow-[0_0_15px_rgba(87,122,255,0.2)] py-2.5 px-4 mb-6 flex flex-wrap justify-between items-center gap-3 no-print overflow-hidden backdrop-blur-sm dark:backdrop-blur-sm">
        <div className="flex items-center gap-4 flex-shrink-0 min-w-0">
            {/* H1 - Left justified */}
            <h2 className="text-xl font-bold text-[#31458F] dark:text-[#93C5FD] whitespace-nowrap">Board Session Report</h2>
            {/* Session Complete pill - to the right of H1 */}
            <div className={`px-3 py-1 rounded-full text-sm font-bold flex items-center gap-2 whitespace-nowrap ${isStreaming ? 'bg-blue-200 dark:bg-blue-800/50 text-[#31458F] dark:text-[#93C5FD]' : 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800/50'}`}>
                 {isStreaming ? (
                    <>
                        <span className="w-2 h-2 rounded-full bg-[#31458F] dark:bg-[#A1B4FF] animate-pulse"/>
                        <span className="hidden sm:inline">Live Session Active</span>
                        <span className="sm:hidden">Live</span>
                    </>
                ) : (
                    <>
                        <span className="w-2 h-2 rounded-full bg-green-600 dark:bg-green-500"/>
                        <span className="hidden sm:inline">Complete</span>
                        <span className="sm:hidden">Done</span>
                    </>
                )}
            </div>
            {/* QC Score Pill - Always show if qcStatus exists */}
            {qcStatus && (
              <div className={`px-3 py-1 rounded-full text-sm font-bold flex items-center gap-2 whitespace-nowrap ${
                qcStatus.total > 0 && (100 - qcStatus.score) >= 90 
                  ? 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800/50'
                  : qcStatus.total > 0 && (100 - qcStatus.score) >= 80
                  ? 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400 border border-yellow-200 dark:border-yellow-800/50'
                  : qcStatus.total > 0
                  ? 'bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800/50'
                  : 'bg-gray-100 dark:bg-gray-900/20 text-gray-700 dark:text-gray-400 border border-gray-200 dark:border-gray-800/50'
              }`}>
                <span className="hidden sm:inline">Research Quality:</span>
                <span className="sm:hidden">Quality:</span>
                <span>{qcStatus.total > 0 ? Math.round(100 - qcStatus.score) : 'N/A'}%</span>
              </div>
            )}
        </div>
        
        <div className="flex gap-2 flex-nowrap justify-end flex-shrink-0 min-w-0 items-center">
            {/* Share button - ALWAYS show unless it's the first free trial report (trial user who just used their free report) */}
            {onShare && !isTrial && (
              <button
                onClick={() => {
                  if (isTrial && subscriptionStatus && subscriptionStatus.reportsRemaining === 0 && subscriptionStatus.needsUpgrade && onUpgrade) {
                    onUpgrade();
                    return;
                  }
                  onShare();
                }}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white dark:bg-[#111827] hover:bg-blue-50 dark:hover:bg-blue-900/30 text-[#31458F] dark:text-[#93C5FD] hover:text-[#577AFF] dark:hover:text-[#577AFF] transition-colors text-xs md:text-sm shadow-sm dark:shadow-[0_0_10px_rgba(87,122,255,0.2)] font-medium whitespace-nowrap border border-blue-200 dark:border-blue-800/50 flex-shrink-0"
                title="Share Report"
              >
                <Share2 className="w-4 h-4 flex-shrink-0" />
                <span className="hidden sm:inline">Share</span>
              </button>
            )}
            <button
                onClick={handlePrint}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white dark:bg-[#111827] hover:bg-blue-50 dark:hover:bg-blue-900/30 text-[#31458F] dark:text-[#93C5FD] hover:text-[#577AFF] dark:hover:text-[#577AFF] transition-colors text-xs md:text-sm shadow-sm dark:shadow-[0_0_10px_rgba(87,122,255,0.2)] font-medium whitespace-nowrap border border-blue-200 dark:border-blue-800/50 flex-shrink-0"
                title="Print / PDF"
            >
                <Printer className="w-4 h-4 flex-shrink-0" />
                <span className="hidden sm:inline">Print / PDF</span>
            </button>
            <button
                onClick={() => handleDownloadHtml().catch(err => console.error('Error exporting HTML:', err))}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white dark:bg-[#111827] hover:bg-blue-50 dark:hover:bg-blue-900/30 text-[#31458F] dark:text-[#93C5FD] hover:text-[#577AFF] dark:hover:text-[#577AFF] transition-colors text-xs md:text-sm shadow-sm dark:shadow-[0_0_10px_rgba(87,122,255,0.2)] font-medium whitespace-nowrap border border-blue-200 dark:border-blue-800/50 flex-shrink-0"
                title="Export HTML"
            >
                <Download className="w-4 h-4 flex-shrink-0" />
                <span className="hidden sm:inline">Export HTML</span>
            </button>
        </div>
      </div>

      {/* 3. Report Content - Rendered as Cards */}
      <SectionErrorBoundary sectionName="Report Content">
      <div id="report-content" className="space-y-6 md:space-y-8 pb-20">
          {(() => {
            try {
              if (!Array.isArray(sections) || sections.length === 0) {
                if (isStreaming) {
                  return null;
                }
                // If not streaming but sections are empty, show the raw content as a fallback
                // This prevents white screen when parsing fails but content exists
                if (safeReportContent && safeReportContent.trim().length > 0) {
                  console.warn('⚠️ No sections parsed, displaying raw report content as fallback');
                  return (
                    <div className="bg-white dark:bg-[#111827] rounded-xl border border-[#EEF2FF] dark:border-[#374151] shadow-sm dark:shadow-[0_0_15px_rgba(87,122,255,0.2)] overflow-hidden">
                      <div className="px-4 py-3 md:px-6 md:py-4 border-b border-[#EEF2FF] dark:border-[#374151] bg-blue-50 dark:bg-blue-900/20 flex items-center gap-3">
                        <FileText className="w-5 h-5 md:w-6 md:h-6 text-[#577AFF] dark:text-[#577AFF]" />
                        <h2 className="text-lg md:text-xl font-bold text-[#577AFF] dark:text-[#93C5FD]">Report Content</h2>
                      </div>
                      <div className="p-4 md:p-8 bg-white dark:bg-[#111827]">
                        <article className="prose prose-slate dark:prose-invert prose-sm md:prose-base max-w-none 
                          prose-p:text-[#595657] dark:prose-p:text-[#9ca3af] prose-p:leading-relaxed prose-p:my-4
                          prose-headings:text-[#221E1F] dark:prose-headings:text-[#f3f4f6] prose-headings:font-bold prose-headings:mt-4 prose-headings:mb-2
                          prose-h2:text-xl prose-h2:font-bold prose-h2:text-[#221E1F] dark:prose-h2:text-[#f3f4f6] prose-h2:mt-4 prose-h2:mb-2 prose-h2:pb-2 prose-h2:border-b-2 prose-h2:border-[#EEF2FF] dark:prose-h2:border-[#374151] prose-h2:pl-0
                          prose-h3:text-lg md:prose-h3:text-xl prose-h3:font-bold prose-h3:!font-bold prose-h3:text-[#051A53] dark:prose-h3:text-[#93C5FD] prose-h3:bg-[#F9FAFD] dark:prose-h3:bg-[#1a1f2e] prose-h3:px-4 prose-h3:py-3 prose-h3:rounded-lg prose-h3:mb-2 prose-h3:mt-1 [&_h3]:font-bold [&_h3]:!font-bold
                          prose-ul:space-y-3 prose-ul:my-6 prose-ul:pl-6 prose-li:marker:text-[#A1B4FF] dark:prose-li:marker:text-[#93C5FD] prose-li:mb-3 prose-li:leading-relaxed prose-li:text-[#595657] dark:prose-li:text-[#9ca3af]
                          prose-ol:space-y-3 prose-ol:my-6 prose-ol:pl-6 prose-li:mb-3 prose-li:leading-relaxed prose-li:text-[#595657] dark:prose-li:text-[#9ca3af]
                          prose-strong:text-[#221E1F] dark:prose-strong:text-[#f3f4f6] prose-strong:font-bold
                          prose-blockquote:bg-[#EEF2FF] dark:prose-blockquote:bg-[#1a1f2e] prose-blockquote:border-l-4 prose-blockquote:border-[#577AFF] prose-blockquote:pl-4 prose-blockquote:py-2 prose-blockquote:my-6 prose-blockquote:italic prose-blockquote:rounded-r-lg prose-blockquote:text-[#595657] dark:prose-blockquote:text-[#9ca3af]
                          prose-table:w-full prose-table:border-collapse prose-table:my-6 prose-table:border prose-table:border-[#EEF2FF] dark:prose-table:border-[#374151]
                          [&_table]:text-xs [&_table]:leading-relaxed [&_table]:bg-white dark:[&_table]:bg-[#111827]
                          prose-thead:bg-[#EEF2FF] dark:prose-thead:bg-[#1a1f2e]
                          prose-th:bg-[#EEF2FF] dark:prose-th:bg-[#1a1f2e] prose-th:text-[#051A53] dark:prose-th:text-[#A1B4FF] prose-th:p-4 prose-th:text-left prose-th:font-bold prose-th:border prose-th:border-[#D5DDFF] dark:prose-th:border-[#374151]
                          prose-tbody:[&>tr:nth-child(odd)]:bg-white dark:prose-tbody:[&>tr:nth-child(odd)]:bg-[#111827] prose-tbody:[&>tr:nth-child(even)]:bg-[#F9FAFD] dark:prose-tbody:[&>tr:nth-child(even)]:bg-[#1a1f2e]
                          prose-td:p-4 prose-td:border prose-td:border-[#EEF2FF] dark:prose-td:border-[#374151] prose-td:align-top prose-td:text-[#595657] dark:prose-td:text-[#9ca3af] [&_td]:break-words [&_td]:overflow-wrap-anywhere [&_td]:word-wrap-break-word
                          [&_tbody_tr]:border-b [&_tbody_tr]:border-[#EEF2FF] dark:[&_tbody_tr]:border-[#374151]
                          [&_tbody_tr:nth-child(odd)_td]:text-[#595657] dark:[&_tbody_tr:nth-child(odd)_td]:text-[#9ca3af]
                          [&_tbody_tr:nth-child(even)_td]:text-[#595657] dark:[&_tbody_tr:nth-child(even)_td]:text-[#9ca3af]
                          [&_tbody_td:first-child]:font-bold [&_tbody_td:first-child]:text-[#221E1F] dark:[&_tbody_td:first-child]:text-[#f3f4f6]
                          [&_tbody_td:last-child]:text-[#577AFF] dark:[&_tbody_td:last-child]:text-[#A1B4FF] [&_tbody_td:last-child]:font-normal [&_tbody_td:last-child]:break-words [&_tbody_td:last-child]:overflow-wrap-anywhere [&_tbody_td:last-child]:word-wrap-break-word
                          [&_th]:break-words [&_th]:overflow-wrap-anywhere [&_th]:word-wrap-break-word
                          [&_table]:table-fixed [&_table]:w-full
                          [&_table_tbody_tr]:py-4
                        ">
                          <SafeMarkdown content={safeReportContent} />
                        </article>
                      </div>
                    </div>
                  );
                }
                // If no content at all, show a message
                return (
                  <div className="w-full p-6 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800/50 rounded-lg">
                    <p className="text-yellow-700 dark:text-yellow-400">Report content is empty. Please try reloading.</p>
                  </div>
                );
              }

              return sections.map((section, idx) => {
                // Validate section before processing
                if (!section || typeof section !== 'string' || section.trim().length === 0) {
                  console.warn(`Section ${idx} is invalid, skipping`);
                  return null;
                }

                return (
                  <SectionErrorBoundary key={`section-${idx}`} sectionName={`Report Section ${idx + 1}`}>
                    {(() => {
                      try {
                        // Extract title from H1 (# Title) - handle multiple formats
                        let title = '';
                        try {
                          // Try multiple regex patterns to catch different H1 formats
                          const titleMatch = section.match(/^#\s*(.+?)(?:\n|$)/m) || 
                                           section.match(/^#\s*(.+)/) ||
                                           section.match(/\n#\s*(.+?)(?:\n|$)/);
                          title = titleMatch && titleMatch[1] ? titleMatch[1].trim() : '';
                          
                          // Clean up title (remove markdown formatting)
                          title = title.replace(/\*\*/g, '').replace(/_/g, '').trim();
                          
                          // Add "(How We Win)" to "Pricing Strategy Recommendations"
                          if (title.toLowerCase().includes('pricing strategy recommendations') && !title.toLowerCase().includes('how we win')) {
                            title = title.replace(/pricing strategy recommendations/gi, 'Pricing Strategy Recommendations (How We Win)');
                          }
                        } catch (e) {
                          console.warn('Error extracting title:', e);
                          title = '';
                        }

                        // Fallback: If regex missed it (rare), check content for keywords to assign title
                        if (!title || title.length > 50) {
                          const sectionLower = section.toLowerCase();
                          if (sectionLower.includes('status') && sectionLower.includes('category')) {
                            title = "Executive Dashboard";
                          } else if (sectionLower.includes('key research') || sectionLower.includes('findings')) {
                            title = "Key Research Findings & Facts";
                          } else if (sectionLower.includes('roast') || sectionLower.includes('gold')) {
                            title = "The Roast & The Gold";
                          } else if (sectionLower.includes('deep dive') || sectionLower.includes('messaging analysis') || sectionLower.includes('pricing model') || sectionLower.includes('pricing tier')) {
                            title = "Deep Dive Analysis";
                          } else if (sectionLower.includes('transcript')) {
                            title = "Raw Board Transcript";
                          } else {
                            title = "Analysis Section";
                          }
                        }
                        
                        const style = getSectionStyle(title);
                        const Icon = style.icon;
                        
                        // Remove the H1 Title from the markdown body strictly so it doesn't duplicate
                        // We match ^# line (or whitespace # line) and replace with empty string
                        // Use multiline flag and be more precise to avoid removing table content
                        let bodyContent = '';
                        try {
                          // More precise regex: only match H1 at the start of the string
                          // Match: optional whitespace, #, whitespace, title text, then newline or end
                          // Use non-greedy match and ensure we only remove the header line
                          const h1Pattern = /^\s*#\s+[^\n\r]*(?:\r?\n|$)/m;
                          
                          // Check if section starts with H1
                          if (/^\s*#\s+/.test(section)) {
                            // Remove only the first H1 line, preserve everything else including tables
                            bodyContent = section.replace(h1Pattern, '').trim();
                            
                            // If removal resulted in empty content, something went wrong - use full section
                            if (!bodyContent || bodyContent.length === 0) {
                              console.warn(`⚠️ H1 removal resulted in empty content for "${title}", using full section`);
                              bodyContent = section.trim();
                            }
                          } else {
                            // No H1 found at start, use entire section
                            bodyContent = section.trim();
                          }
                          
                          // Debug logging for Executive Dashboard (dev only)
                          if ((title.toLowerCase().includes('executive') || title.toLowerCase().includes('dashboard')) && import.meta.env.DEV) {
                            console.log('🔍 Executive Dashboard Debug:', {
                              originalSectionLength: section.length,
                              bodyContentLength: bodyContent.length,
                              bodyContentPreview: bodyContent.substring(0, 200),
                              hasTable: bodyContent.includes('|'),
                              sectionPreview: section.substring(0, 200)
                            });
                          }
                          
                          // Fallback: if bodyContent is empty but section has content, use section
                          if (!bodyContent || bodyContent.length === 0) {
                            console.warn(`⚠️ Body content empty for section "${title}", using full section`);
                            bodyContent = section.trim();
                          }
                          
                          // IMPORTANT: Do NOT remove separator rows from markdown before parsing!
                          // Markdown tables REQUIRE the separator row (|----------|) to be recognized as tables.
                          // The separator rows will be filtered out during HTML rendering in SafeMarkdown components.
                          
                          // Only clean up clearly malformed patterns (multiple consecutive separator rows)
                          // Keep single separator rows as they're needed for markdown parsing
                          bodyContent = bodyContent.replace(/\n\|[\s|\-:]+\|\n\|[\s|\-:]+\|/g, '\n|----------|----------|----------|----------|\n');
                        } catch (e) {
                          console.warn('Error processing body content:', e);
                          bodyContent = typeof section === 'string' ? section.trim() : '';
                        }

                        // Don't return null if bodyContent is empty - show something
                        if (!bodyContent || bodyContent.length === 0) {
                          console.warn(`⚠️ Section "${title}" has no body content, showing placeholder`);
                          return (
                            <div className={`bg-white dark:bg-[#111827] rounded-xl border ${style.border} shadow-sm dark:shadow-[0_0_15px_rgba(87,122,255,0.2)] overflow-hidden p-8`}>
                              <div className={`px-4 py-3 md:px-6 md:py-4 border-b ${style.border} ${style.bg} flex items-center gap-3`}>
                                <Icon className={`w-5 h-5 md:w-6 md:h-6 ${style.color}`} />
                                <h2 className={`text-lg md:text-xl font-bold ${style.color}`}>{title}</h2>
                              </div>
                              <div className="p-4 md:p-8">
                                <p className="text-[#595657] dark:text-[#9ca3af]">Content is being processed...</p>
                              </div>
                            </div>
                          );
                        }

                        return (
                          <div className={`bg-white dark:bg-[#111827] rounded-xl border ${style.border} shadow-sm dark:shadow-[0_0_15px_rgba(87,122,255,0.2)] overflow-hidden transition-all duration-500 hover:shadow-md`}>
                            {/* Colored Header Band with Title */}
                            <div className={`px-4 py-3 md:px-6 md:py-4 border-b ${style.border} ${style.bg} flex items-center gap-3`}>
                              <Icon className={`w-5 h-5 md:w-6 md:h-6 ${style.color}`} />
                              <h2 className={`text-lg md:text-xl font-bold ${style.color}`}>
                                {title.toLowerCase().includes('pricing strategy recommendations') && !title.toLowerCase().includes('how we win')
                                  ? title.replace(/pricing strategy recommendations/gi, 'Pricing Strategy Recommendations (How We Win)')
                                  : title}
                              </h2>
                            </div>
                            
                            <div className="p-4 md:p-8 bg-white dark:bg-[#111827]">
                              <article className="prose prose-slate dark:prose-invert prose-sm md:prose-base max-w-none 
                                  prose-p:text-[#595657] dark:prose-p:text-[#9ca3af] prose-p:leading-relaxed prose-p:my-4
                                  prose-headings:text-[#221E1F] dark:prose-headings:text-[#f3f4f6] prose-headings:font-bold prose-headings:mt-8 prose-headings:mb-4
                                  prose-h2:text-xl prose-h2:font-bold prose-h2:text-[#221E1F] dark:prose-h2:text-[#f3f4f6] prose-h2:mt-8 prose-h2:mb-4 prose-h2:pb-2 prose-h2:border-b-2 prose-h2:border-[#EEF2FF] dark:prose-h2:border-[#374151] prose-h2:pl-0
                                  
                                  prose-h3:text-lg md:prose-h3:text-xl prose-h3:font-bold prose-h3:!font-bold prose-h3:text-[#051A53] dark:prose-h3:text-[#A1B4FF] prose-h3:bg-[#F9FAFD] dark:prose-h3:bg-[#1a1f2e] prose-h3:px-4 prose-h3:py-3 prose-h3:rounded-lg prose-h3:mb-6 prose-h3:mt-4 [&_h3]:font-bold [&_h3]:!font-bold
                                  
                                  prose-ul:space-y-3 prose-ul:my-6 prose-ul:pl-6 prose-li:marker:text-[#A1B4FF] dark:prose-li:marker:text-[#577AFF] prose-li:mb-3 prose-li:leading-relaxed prose-li:text-[#595657] dark:prose-li:text-[#9ca3af]
                                  prose-ol:space-y-3 prose-ol:my-6 prose-ol:pl-6 prose-li:mb-3 prose-li:leading-relaxed prose-li:text-[#595657] dark:prose-li:text-[#9ca3af]
                                  prose-strong:text-[#221E1F] dark:prose-strong:text-[#f3f4f6] prose-strong:font-bold
                                  prose-blockquote:bg-[#EEF2FF] dark:prose-blockquote:bg-[#1a1f2e] prose-blockquote:border-l-4 prose-blockquote:border-[#577AFF] prose-blockquote:pl-4 prose-blockquote:py-2 prose-blockquote:my-6 prose-blockquote:italic prose-blockquote:rounded-r-lg prose-blockquote:text-[#595657] dark:prose-blockquote:text-[#9ca3af]
                                  
                                  prose-table:w-full prose-table:border-collapse prose-table:my-6 prose-table:border prose-table:border-[#EEF2FF] dark:prose-table:border-[#374151]
                                  [&_table]:text-xs [&_table]:leading-relaxed [&_table]:bg-white dark:[&_table]:bg-[#111827]
                                  prose-thead:bg-[#EEF2FF] dark:prose-thead:bg-[#1a1f2e]
                                  prose-th:bg-[#EEF2FF] dark:prose-th:bg-[#1a1f2e] prose-th:text-[#051A53] dark:prose-th:text-[#93C5FD] prose-th:p-4 prose-th:text-left prose-th:font-bold prose-th:border prose-th:border-[#D5DDFF] dark:prose-th:border-[#374151]
                                  prose-tbody:[&>tr:nth-child(odd)]:bg-white dark:prose-tbody:[&>tr:nth-child(odd)]:bg-[#111827] prose-tbody:[&>tr:nth-child(even)]:bg-[#F9FAFD] dark:prose-tbody:[&>tr:nth-child(even)]:bg-[#1a1f2e]
                                  prose-td:p-4 prose-td:border prose-td:border-[#EEF2FF] dark:prose-td:border-[#374151] prose-td:align-top prose-td:text-[#595657] dark:prose-td:text-[#9ca3af] [&_td]:break-words [&_td]:overflow-wrap-anywhere [&_td]:word-wrap-break-word
                                  [&_tbody_tr]:border-b [&_tbody_tr]:border-[#EEF2FF] dark:[&_tbody_tr]:border-[#374151]
                                  [&_tbody_tr:nth-child(odd)_td]:text-[#595657] dark:[&_tbody_tr:nth-child(odd)_td]:text-[#9ca3af]
                                  [&_tbody_tr:nth-child(even)_td]:text-[#595657] dark:[&_tbody_tr:nth-child(even)_td]:text-[#9ca3af]
                                  [&_tbody_td:first-child]:font-bold [&_tbody_td:first-child]:text-[#221E1F] dark:[&_tbody_td:first-child]:text-[#f3f4f6]
                                  [&_tbody_td:last-child]:text-[#577AFF] dark:[&_tbody_td:last-child]:text-[#93C5FD] [&_tbody_td:last-child]:font-normal [&_tbody_td:last-child]:break-words [&_tbody_td:last-child]:overflow-wrap-anywhere [&_tbody_td:last-child]:word-wrap-break-word
                                  [&_th]:break-words [&_th]:overflow-wrap-anywhere [&_th]:word-wrap-break-word
                                  [&_table]:table-fixed [&_table]:w-full
                                  [&_table_tbody_tr]:py-4
                              ">
                                {(() => {
                                  try {
                                    if (!bodyContent || typeof bodyContent !== 'string' || bodyContent.trim().length === 0) {
                                      console.warn(`⚠️ Empty bodyContent for section: ${title}`);
                                      return <div className="text-[#595657]">No content available</div>;
                                    }
                                    
                                    // Debug for Executive Dashboard
                                    if (title.toLowerCase().includes('executive') || title.toLowerCase().includes('dashboard')) {
                                      console.log('📊 Rendering Executive Dashboard:', {
                                        bodyContentLength: bodyContent.length,
                                        firstChars: bodyContent.substring(0, 200),
                                        hasTableMarkers: bodyContent.includes('|'),
                                        hasNewlines: bodyContent.includes('\n'),
                                        bodyContentPreview: bodyContent.substring(0, 500)
                                      });
                                    }
                                    
                                    return <SafeMarkdown content={bodyContent} />;
                                  } catch (markdownError) {
                                    console.error('Error rendering markdown:', markdownError);
                                    console.error('Body content that failed:', bodyContent?.substring(0, 500));
                                    return (
                                      <div className="text-[#595657] dark:text-[#9ca3af] p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800/50 rounded">
                                        <p className="font-semibold text-yellow-800 dark:text-yellow-400 mb-2">Content Display Error</p>
                                        <pre className="text-xs overflow-auto max-h-96 whitespace-pre-wrap text-[#595657] dark:text-[#9ca3af]">
                                          {typeof bodyContent === 'string' ? bodyContent.substring(0, 5000) : 'Content unavailable'}
                                        </pre>
                                      </div>
                                    );
                                  }
                                })()}
                              </article>

                              {/* Back to Top Link */}
                              <div className="mt-8 pt-6 border-t border-[#EEF2FF] dark:border-[#374151] flex justify-end no-print">
                                <button 
                                  onClick={scrollToTop}
                                  className="flex items-center gap-1 text-xs font-bold text-[#595657] dark:text-[#9ca3af] hover:text-[#577AFF] dark:hover:text-[#93C5FD] transition-colors uppercase tracking-wider"
                                >
                                  Back to top
                                  <ArrowUp className="w-3 h-3" />
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      } catch (sectionError) {
                        console.error(`Error rendering section ${idx}:`, sectionError);
                        // Return a safe fallback section
                        return (
                          <div className="bg-white dark:bg-[#111827] rounded-xl border border-[#EEF2FF] dark:border-[#374151] shadow-sm dark:shadow-[0_0_15px_rgba(87,122,255,0.2)] overflow-hidden p-8">
                            <h2 className="text-xl font-bold text-[#221E1F] dark:text-[#f3f4f6] mb-4">Report Section {idx + 1}</h2>
                            <div className="text-[#595657] dark:text-[#9ca3af]">
                              <SafeMarkdown content={typeof section === 'string' ? section.substring(0, 5000) : 'Content unavailable'} />
                            </div>
                          </div>
                        );
                      }
                    })()}
                  </SectionErrorBoundary>
                );
              }).filter(Boolean); // Remove any null entries
            } catch (sectionsError) {
              console.error('Error rendering sections:', sectionsError);
              return (
                <div className="w-full p-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50 rounded-lg">
                  <p className="text-red-700 dark:text-red-400">Error rendering report sections. Please try reloading.</p>
                  <button
                    onClick={() => window.location.reload()}
                    className="mt-4 px-4 py-2 bg-red-600 dark:bg-red-700 text-white rounded hover:bg-red-700 dark:hover:bg-red-800"
                  >
                    Reload Page
                  </button>
                </div>
              );
            }
          })()}
          <div ref={bottomRef} className="h-1" />
      </div>
      </SectionErrorBoundary>
    </div>
    </>
  );
};


// Industry Info Content Component Removed

export default ReportDisplay;

import rawAdhkarData from '../assets/data/azkar/azkar';
import emotionalResponsesDataJson from '../assets/data/chatbot/emotional_responses.json'; 

const RORK_TOOLKIT_API_URL = 'https://toolkit.rork.com/text/llm/';

const SYSTEM_INSTRUCTION_TEXT = `أنت سالتي، شات بوت إسلامي مساعد. هدفك هو تقديم الإرشاد الروحي والراحة والحكمة الإسلامية للمستخدمين. عندما يعبر المستخدمون عن مشاعرهم أو يطرحون أسئلة، حاول أن تجيب بـ:
1.  آية قرآنية مناسبة (مع الإشارة إلى السورة ورقم الآية إن أمكن).
2.  دعاء أو ذكر مناسب ومأثور.
3.  كلمات حكمة موجزة أو نصيحة من المنظور الإسلامي.
4.  إذا كان السؤال يتعلق بقصة نبي، قدم ملخصًا للقصة والدرس المستفاد منها مع آية شاهدة.
5.  إذا سأل المستخدم عن سورة معينة، قدم معلومات عنها (اسمها، مكية/مدنية، عدد آياتها، أبرز مواضيعها، وآية مميزة منها مع مرجعها).

عند الرد، يرجى مراعاة سياق المحادثة السابقة لتقديم ردود مترابطة وتجنب تكرار المعلومات التي قدمتها سابقًا.

إذا لم تجد تطابقًا دقيقًا في قاعدة بياناتك المحلية للردود:
- إذا كان سؤال المستخدم غامضًا، لا تتردد في طرح أسئلة توضيحية لتحديد احتياجه بدقة، مثل: 'هل تقصد دعاءً لمناسبة معينة؟'، 'هل يمكنك تحديد أي جانب من جوانب هذا الموضوع تسأل عنه؟'، أو 'لم أفهم تمامًا، هل يمكنك إعادة صياغة سؤالك أو تقديم المزيد من التفاصيل؟'.
- إذا كان السياق واضحًا إلى حد ما ولكن لا يوجد رد مباشر، حاول تقديم نصيحة إسلامية عامة ذات صلة بمشاعره، أو آية وذكر إذا استطعت استنباط ذلك بناءً على فهمك للموقف (مثال: "لم أجد ردًا مباشرًا، ولكن يمكنني أن أذكرك بأهمية الصبر" أو "هل تود معرفة المزيد عن فضل الاستغفار؟").
- بناءً على سير الحوار، إذا كان مناسبًا، يمكنك أن تقترح بشكل استباقي أدعية، آيات، أو مواضيع ذات صلة قد تهم المستخدم. إذا اقترحت آية يمكن الرجوع إليها، أضف مرجعها بين قوسين هكذا: \`[AYAH_REF:اسم السورة:رقم الآية]\`. إذا اقترحت أذكارًا من فئة معينة، أضف اسم الفئة بين قوسين هكذا: \`[DHIKR_CATEGORY:اسم فئة الذكر]\`.
- تجنب الإجابات العامة جدًا مثل "لا أفهم" أو "أعد صياغة السؤال" إذا أمكن، وحاول دائمًا تقديم قيمة إرشادية.

حافظ على الردود موجزة ومتعاطفة ومركزة على التعاليم الإسلامية. احتفظ دائماً بنبرة محترمة وداعمة. اجب باللغة العربية. إذا كان السؤال خارج نطاق معرفتك الدينية تمامًا أو يتطلب فتوى متخصصة، اعتذر بلطف وانصح المستخدم بالرجوع إلى أهل العلم الموثوقين.`;

interface EmotionalResponse {
  keywords: string[];
  // Fields for standard emotional/question responses
  ayah?: string; // For SurahInfo, this is the representativeAyah
  ayahRef?: string; // For SurahInfo, this is the representativeAyahRef
  dhikr?: string;
  dhikrCategory?: string;
  message?: string | string[]; // For SurahInfo, this is not directly used for the main content
  storyTitle?: string;
  storySummary?: string;
  storyLesson?: string;
  primaryContext?: string;

  // Fields specific to Surah Info
  isSurahInfo?: true;
  surahId?: number;
  surahNameArabic?: string;
  surahNameEnglish?: string;
  revelationType?: 'Meccan' | 'Medinan';
  totalVerses?: number;
  themes?: string[];
  representativeAyah?: string; // Used if 'ayah' field is reserved for general emotional responses
  representativeAyahRef?: string; // Used if 'ayahRef' field is reserved
}

interface ChatbotData {
  suggestedPrompts: string[];
  emotionalTriggers: EmotionalResponse[];
}

const emotionalResponsesData = emotionalResponsesDataJson as ChatbotData;

export interface ApiContentPart { 
  text: string;
}
export interface ApiContent {  
  role: 'user' | 'model';
  parts: ApiContentPart[];
}

interface RorkMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

const findLocalEmotionalResponse = (userInput: string): { response: EmotionalResponse; context: string | undefined } | null => {
  const lowerInput = userInput.toLowerCase().replace(/[.,!؟،؛]/g, "").trim(); 
  const inputWords = lowerInput.split(/\s+/).filter(Boolean); 

  if (emotionalResponsesData && Array.isArray(emotionalResponsesData.emotionalTriggers)) {
    for (const entry of emotionalResponsesData.emotionalTriggers) {
      let matchedKeywordCategory: string | undefined = undefined;
      for (const keyword of entry.keywords) {
        const lowerKeyword = keyword.toLowerCase();
        if (!matchedKeywordCategory) {
           matchedKeywordCategory = keyword; 
        }

        if (lowerKeyword.includes(" ")) { 
            if (lowerInput.includes(lowerKeyword)) { 
                return { response: entry, context: entry.primaryContext || (entry.isSurahInfo ? "معلومات عن سورة" : matchedKeywordCategory) };
            }
        } else { 
            if (inputWords.includes(lowerKeyword)) { 
                 return { response: entry, context: entry.primaryContext || (entry.isSurahInfo ? "معلومات عن سورة" : matchedKeywordCategory) };
            }
        }
      }
    }
  }
  return null;
};

const findDuaByQuery = (userInput: string): any | null => {
  const cleanedInput = userInput.replace(/[.,!؟،؛]/g, "").trim();

  // Remove common introductory phrases to get to the core of the request.
  const coreQuery = cleanedInput
    .replace(/^(أريد|ما هو|عن|لي|بدي|اعطني|ادعية|دعاء|ذكر|ابحث عن)\s*/, '')
    .trim();
  
  // Don't search for very short or generic terms to avoid false positives.
  if (coreQuery.length < 3) return null;

  // Find the first adhkar whose category or search string contains the core query.
  // We prioritize 'search' field as it might contain more keywords.
  const foundAdhkar = rawAdhkarData.find(adhkar => 
    (adhkar.search && adhkar.search.includes(coreQuery)) || adhkar.category.includes(coreQuery)
  );

  return foundAdhkar || null;
}

export const getChatbotResponse = async (userInput: string, history: ApiContent[] = []): Promise<{ text: string; emotionalContext?: string; ayahRef?: string; dhikrCategory?: string }> => {
  
  // NEW: Step 1: Search for a specific Dua in the main azkar.ts database.
  const specificDua = findDuaByQuery(userInput);
  if (specificDua) {
    let responseText = `بالتأكيد، هذا هو "${specificDua.category}":\n\n`;
    responseText += `"${specificDua.zekr.trim()}"\n\n`;
    if (specificDua.description && specificDua.description.trim()) {
      responseText += `الفضل: ${specificDua.description.trim()}\n`;
    }
    if (specificDua.reference && specificDua.reference.trim()) {
      responseText += `المرجع: ${specificDua.reference.trim()}\n`;
    }
    // Add the interactive button tag
    responseText += `\n[DHIKR_CATEGORY:${specificDua.category}]`;

    return {
      text: responseText.trim(),
      dhikrCategory: specificDua.category,
      emotionalContext: "طلب دعاء محدد"
    };
  }
  
  // Step 2: If no specific Dua is found, fall back to emotional/general responses.
  const localResponseResult = findLocalEmotionalResponse(userInput);
  if (localResponseResult) {
    const entry = localResponseResult.response;
    const matchedContext = localResponseResult.context;

    if (entry.isSurahInfo) {
      if (entry.surahNameArabic && entry.revelationType && entry.totalVerses && entry.themes && entry.ayah && entry.ayahRef) {
        let responseText = `سورة ${entry.surahNameArabic} (${entry.surahNameEnglish || ''})\n`;
        responseText += `هي سورة ${entry.revelationType === 'Meccan' ? 'مكية' : 'مدنية'} وعدد آياتها ${entry.totalVerses}.\n\n`;
        responseText += `من أبرز مواضيعها:\n- ${entry.themes.join('\n- ')}\n\n`;
        responseText += `آية مميزة منها: "${entry.ayah}" (${entry.ayahRef})\n\n`;
        responseText += `يمكنك قراءتها كاملة في قسم المصحف. إذا أردت الانتقال مباشرة لهذه الآية المميزة، اضغط على الزر أدناه.`;
        
        return {
          text: responseText.trim(),
          ayahRef: entry.ayahRef, 
          emotionalContext: matchedContext || "معلومات عن سورة"
        };
      } else {
        console.warn("SurahInfo entry is missing some fields:", entry);
        return { text: `معلومات غير مكتملة عن سورة ${entry.surahNameArabic || 'المحددة'}.`};
      }
    } else {
      // Existing logic for other emotional/question responses
      let messageText = "";
      if (entry.message) { // Check if message exists
          if (Array.isArray(entry.message)) {
            messageText = entry.message[Math.floor(Math.random() * entry.message.length)];
          } else {
            messageText = entry.message;
          }
      }

      let responseString = "";

      if (entry.storyTitle && entry.storySummary && entry.storyLesson) {
        responseString += `قصة: ${entry.storyTitle}\n\n`;
        responseString += `ملخصها: ${entry.storySummary}\n\n`;
        responseString += `الدرس المستفاد: ${entry.storyLesson}\n\n`;
      }

      if (entry.ayah) {
        responseString += `قال الله تعالى: "${entry.ayah}"`;
        if(entry.ayahRef) {
          responseString += `\n[AYAH_REF:${entry.ayahRef}]`;
        }
        responseString += "\n\n"; 
      }
      
      if (entry.dhikr) {
        responseString += `يمكنك أن تدعو بهذا الذكر: "${entry.dhikr}"`;
        if(entry.dhikrCategory) {
          responseString += `\n[DHIKR_CATEGORY:${entry.dhikrCategory}]`;
        }
        responseString += "\n\n";
      }
      
      responseString += messageText; // Add the main message content
      return { 
        text: responseString.trim(), 
        emotionalContext: matchedContext, 
        ayahRef: entry.ayahRef, 
        dhikrCategory: entry.dhikrCategory 
      };
    }
  }
  
  // Fallback to API if no local response (Rork only)
  // --- EXTERNAL API CALL DISABLED ---
  const USE_EXTERNAL_API = false;
  if (USE_EXTERNAL_API) {
    try {
      console.log("No local response. Attempting Rork Toolkit API...");
      const rorkMessages: RorkMessage[] = [
        { role: 'system', content: SYSTEM_INSTRUCTION_TEXT }
      ];
      history.forEach(h => {
        if (h.role === 'user') {
            rorkMessages.push({ role: 'user', content: h.parts[0].text });
        } else if (h.role === 'model') { 
            rorkMessages.push({ role: 'assistant', content: h.parts[0].text });
        }
      });
      rorkMessages.push({ role: 'user', content: userInput });

      const rorkResponse = await fetch(RORK_TOOLKIT_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: rorkMessages }),
      });
      
      if (rorkResponse.ok) {
        const data = await rorkResponse.json();
        if (data.completion) {
          console.log("Rork Toolkit API response:", data.completion);
          return { text: data.completion };
        }
        console.warn("Invalid response from Rork Toolkit: 'completion' missing.");
        throw new Error("Invalid response from Rork API.");
      } else {
          const errorText = await rorkResponse.text();
          console.warn(`Rork Toolkit API failed (Status: ${rorkResponse.status}). Response: ${errorText}.`);
          throw new Error(`Rork API request failed: ${rorkResponse.status}`);
      }
    } catch (apiError: any) {
      console.error('Error with API fallback:', apiError.message);
      return { text: "عفواً، أواجه بعض الصعوبات التقنية. يرجى المحاولة مرة أخرى بعد قليل." };
    }
  }
  // --- END OF DISABLED API CALL ---

  // Provide a generic local fallback if no local response is found and API is disabled
  return { 
      text: "عفوًا، لم أجد إجابة محددة لسؤالك. حاول صياغة سؤالك بشكل مختلف أو استكشف أقسام التطبيق الأخرى." 
  };
};
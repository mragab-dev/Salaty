  import { allResponses, suggestedPrompts } from '../assets/data/chatbot/responses';
  import type { EmotionalResponse } from '../types';

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

  const normalizeArabic = (text: string): string => {
    if (!text) return "";
    return text
      .replace(/[أإآ]/g, 'ا') // Normalize Alef
      .replace(/ى/g, 'ي')     // Normalize Yaa
      .replace(/ة/g, 'ه');    // Normalize Taa Marbuta
  };

  const findLocalEmotionalResponse = (userInput: string): { response: EmotionalResponse; context: string | undefined } | null => {
    const normalizedUserInput = normalizeArabic(userInput.toLowerCase().replace(/[.,!؟،؛]/g, "").trim()); 
    const inputWords = normalizedUserInput.split(/\s+/).filter(Boolean); 

    if (allResponses && Array.isArray(allResponses)) {
      for (const entry of allResponses) {
        let matchedKeywordCategory: string | undefined = undefined;
        for (const keyword of entry.keywords) {
          const normalizedKeyword = normalizeArabic(keyword.toLowerCase());
          if (!matchedKeywordCategory) {
             matchedKeywordCategory = keyword;
          }

          if (normalizedKeyword.includes(" ")) { 
              if (normalizedUserInput.includes(normalizedKeyword)) { 
                  return { response: entry, context: entry.primaryContext || (entry.isSurahInfo ? "معلومات عن سورة" : matchedKeywordCategory) };
              }
              const keywordParts = normalizedKeyword.split(/\s+/);
              if (inputWords.length === 1 && keywordParts.includes(inputWords[0])) {
                  const word = inputWords[0];
                  const commonWords = ["قصه", "دعاء", "فضل", "ما", "هي", "هو", "النبي"];
                  if (word.length > 2 && !commonWords.includes(word)) {
                       return { response: entry, context: entry.primaryContext || (entry.isSurahInfo ? "معلومات عن سورة" : matchedKeywordCategory) };
                  }
              }
          } else { 
              if (inputWords.includes(normalizedKeyword)) { 
                   return { response: entry, context: entry.primaryContext || (entry.isSurahInfo ? "معلومات عن سورة" : matchedKeywordCategory) };
              }
          }
        }
      }
    }
    return null;
  };

  export const getChatbotResponse = async (
    userInput: string, 
    history: ApiContent[] = []
  ): Promise<{ 
    text: string; 
    emotionalContext?: string; 
    ayahRef?: string; 
    dhikrCategory?: string;
    navigationHint?: { label: string; target: string; };
  }> => {
    
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
        let messageText = "";
        if (entry.message) {
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
          if (entry.tafsir) {
            responseString += `\n\nشرح الآية: ${entry.tafsir}`;
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
        
        responseString += messageText;
        return { 
          text: responseString.trim(), 
          emotionalContext: matchedContext, 
          ayahRef: entry.ayahRef, 
          dhikrCategory: entry.dhikrCategory,
          navigationHint: entry.navigationHint, 
        };
      }
    }
    
    return { 
        text: "عفوًا، لم أجد إجابة محددة لسؤالك. حاول صياغة سؤالك بشكل مختلف أو استكشف أقسام التطبيق الأخرى." 
    };
  };
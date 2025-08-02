import React from 'react';
import { View, Text, StyleSheet, ScrollView, Platform } from 'react-native';
import { RFValue } from 'react-native-responsive-fontsize';
import Colors from '../constants/colors';
import { SalatyLogoIcon } from '../components/Icons';

const FeatureSection: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <View style={styles.section}>
    <Text style={styles.sectionTitle}>{title}</Text>
    <View>{children}</View>
  </View>
);

const HowToText: React.FC<{ children: string }> = ({ children }) => (
    <Text style={styles.sectionText}><Text style={styles.boldText}>كيف تستخدمها: </Text>{children}</Text>
);

const AboutScreen: React.FC = () => {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <View style={styles.header}>
        <SalatyLogoIcon size={RFValue(60)} color={Colors.secondary}/>
        <Text style={styles.headerTitle}>عن تطبيق صلاتي</Text>
        <Text style={styles.headerSubtitle}>دليلك الشامل لاستخدام التطبيق والاستفادة من جميع مميزاته.</Text>
      </View>

      <FeatureSection title="مواقيت الصلاة الدقيقة">
        <Text style={styles.sectionText}>
          يوفر لك التطبيق مواقيت الصلاة بناءً على موقعك الجغرافي بدقة عالية، مع تنبيهات الأذان القابلة للتخصيص، وتذكيرات قبل وقت الصلاة، بالإضافة إلى عرض التاريخ الهجري والميلادي.
        </Text>
        <HowToText>
          يقوم التطبيق تلقائيًا بتحديد موقعك لعرض أوقات الصلاة. يمكنك تخصيص أصوات الأذان وتعيين تذكيرات ما قبل الصلاة من شاشة "الإعدادات".
        </HowToText>
      </FeatureSection>
      
      <FeatureSection title="المصحف الشريف المتكامل">
        <Text style={styles.sectionText}>
          تجربة قراءة فريدة للمصحف الشريف بنظام الصفحات. يمكنك الاستماع للآيات بصوت قارئك المفضل، عرض التفسير الميسر، حفظ علامات مرجعية، وتغيير حجم الخط لراحة عينيك.
        </Text>
        <HowToText>
          تنقل بين الصفحات باستخدام أزرار "التالية" و"السابقة". اضغط على أي آية لفتح قائمة خيارات تتيح لك الاستماع، الحفظ كعلامة مرجعية، عرض التفسير، أو المشاركة. للوصول إلى خيارات إضافية مثل تغيير القارئ أو حجم الخط، اضغط على أيقونة القائمة (الثلاث نقاط) في أعلى يمين الشاشة.
        </HowToText>
      </FeatureSection>

      <FeatureSection title="اختبار الحفظ">
         <Text style={styles.sectionText}>
          عزز حفظك للقرآن الكريم عبر ميزة اختبار الحفظ التفاعلية. اختر السورة ونطاق الآيات ومستوى الصعوبة، وسيقوم التطبيق بإخفاء بعض الكلمات لمساعدتك على مراجعة حفظك وتثبيته.
        </Text>
        <HowToText>
          من قائمة خيارات المصحف (أيقونة الثلاث نقاط)، اختر "بدء اختبار حفظ". اتبع الخطوات لاختيار السورة، نطاق الآيات، ومستوى الصعوبة لبدء الاختبار التفاعلي.
        </HowToText>
      </FeatureSection>
      
      <FeatureSection title="الأذكار والأدعية">
        <Text style={styles.sectionText}>
          حصنك اليومي من أذكار الصباح والمساء، بالإضافة إلى مجموعة واسعة من الأذكار والأدعية لجميع مناسبات حياتك اليومية. يمكنك أيضًا إعداد تذكيرات يومية لأذكار الصباح والمساء.
        </Text>
        <HowToText>
          من قسم "الأذكار"، اختر فئة مثل "أذكار الصباح" للبدء. اضغط على زر العداد لكل ذكر لإحصاء التكرارات. لإعداد تنبيهات يومية، اذهب إلى "الإعدادات" ثم "تذكيرات الأذكار".
        </HowToText>
      </FeatureSection>
      
      <FeatureSection title="السبحة الإلكترونية">
        <Text style={styles.sectionText}>
          سبحة إلكترونية متطورة تساعدك على التسبيح والذكر بسهولة. اختر الذكر الذي تريده من قائمة الأذكار المأثورة أو استخدم الوضع الحر للتسبيح بعدد غير محدد.
        </Text>
        <HowToText>
          تجد السبحة في شاشة "الصلاة". اختر من قائمة التسبيحات السريعة لفتح عداد ملء الشاشة. يمكنك تغيير وضع العداد أو إعداداته من الأزرار الموجودة في أعلى شاشة التسبيح.
        </HowToText>
      </FeatureSection>
      
      <FeatureSection title="لوحة الإنجازات (التقارير)">
         <Text style={styles.sectionText}>
          تابع عبادتك اليومية وحافظ على التزامك. تسجل لوحة الإنجازات إتمامك للأذكار، جلسات قراءة القرآن، والتسبيح، مما يحفزك على الاستمرارية والمداومة على الطاعات.
        </Text>
        <HowToText>
          اذهب إلى قسم "التقارير" لعرض ملخص مرئي لنشاطك خلال الأسبوع الماضي. يقوم التطبيق تلقائيًا بتسجيل إنجازاتك عند إتمام الأذكار أو قراءة القرآن، مما يساعدك على بناء عادات إيمانية ثابتة.
        </HowToText>
      </FeatureSection>

      <FeatureSection title="المساعد الذكي 'صلاتي'">
        <Text style={styles.sectionText}>
          اطرح أسئلتك الدينية، شارك ما تشعر به، أو اطلب قصة نبي. المساعد الذكي "صلاتي" مصمم ليقدم لك إجابات مستندة إلى القرآن والسنة، وآيات وأدعية تجلب الطمأنينة لقلبك.
        </Text>
        <HowToText>
          اضغط على أيقونة الدردشة العائمة في أي شاشة لبدء محادثة مع "صلاتي". يمكنك الكتابة بحرية أو استخدام الاقتراحات السريعة.
        </HowToText>
      </FeatureSection>

       <FeatureSection title="الإعدادات والتخصيص">
        <Text style={styles.sectionText}>
          شاشة "الإعدادات" هي مركز التحكم في تجربتك.
        </Text>
        <HowToText>
           من خلالها يمكنك: إدارة إشعارات مواقيت الصلاة، تغيير صوت الأذان، ضبط تذكيرات الأذكار اليومية، والوصول إلى هذه الصفحة التعريفية.
        </HowToText>
      </FeatureSection>
      
      <Text style={styles.footerText}>نسعى دائمًا لتطوير التطبيق وإضافة المزيد من الميزات النافعة. تقبل الله منا ومنكم صالح الأعمال.</Text>

    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  contentContainer: {
    padding: RFValue(16),
  },
  header: {
    alignItems: 'center',
    backgroundColor: Colors.primary,
    padding: RFValue(20),
    borderRadius: RFValue(12),
    marginBottom: RFValue(20),
  },
  headerTitle: {
    fontSize: RFValue(26),
    fontWeight: 'bold',
    color: Colors.secondary,
    marginTop: RFValue(10),
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif-medium',
  },
  headerSubtitle: {
    fontSize: RFValue(16),
    color: Colors.moonlight,
    textAlign: 'center',
    marginTop: RFValue(5),
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
  section: {
    backgroundColor: Colors.white,
    borderRadius: RFValue(10),
    padding: RFValue(16),
    marginBottom: RFValue(16),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: RFValue(18),
    fontWeight: '600',
    color: Colors.primary,
    textAlign: 'right',
    marginBottom: RFValue(10),
    paddingBottom: RFValue(5),
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif-medium',
  },
  sectionText: {
    fontSize: RFValue(15),
    color: Colors.text,
    textAlign: 'right',
    lineHeight: RFValue(24),
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
    marginBottom: RFValue(8),
  },
  boldText: {
      fontWeight: 'bold',
      color: Colors.primary,
  },
  footerText: {
    textAlign: 'center',
    color: Colors.accent,
    marginTop: RFValue(10),
    fontSize: RFValue(14),
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
});

export default AboutScreen;

import { db } from './src/lib/db'

async function seedDoctors() {
  console.log('🌱 Seeding doctors...')

  const doctors = [
    {
      name: 'Dr. Rajesh Sharma',
      specialty: 'General Physician',
      clinicName: 'Sharma Family Clinic',
      address: '302, New Sion Co-op Hsg Society, Sion East',
      city: 'Mumbai',
      state: 'Maharashtra',
      phone: '+91 98200 45678',
      rating: 4.7,
      reviewCount: 324,
      availableDays: 'Mon-Sat',
      availableHours: '9:00 AM - 1:00 PM, 5:00 PM - 9:00 PM',
      consultationFee: 500,
      isVerified: true,
    },
    {
      name: 'Dr. Priya Nair',
      specialty: 'General Physician',
      clinicName: 'Nair Health Care',
      address: '15, S.V. Road, Andheri West',
      city: 'Mumbai',
      state: 'Maharashtra',
      phone: '+91 98676 12345',
      rating: 4.5,
      reviewCount: 198,
      availableDays: 'Mon-Fri',
      availableHours: '10:00 AM - 2:00 PM, 6:00 PM - 8:30 PM',
      consultationFee: 400,
      isVerified: true,
    },
    {
      name: 'Dr. Amit Deshmukh',
      specialty: 'Cardiologist',
      clinicName: 'Deshmukh Heart Center',
      address: 'B-12, Pinnacle Business Park, Andheri Kurla Road',
      city: 'Mumbai',
      state: 'Maharashtra',
      phone: '+91 98765 43210',
      rating: 4.9,
      reviewCount: 512,
      availableDays: 'Mon-Sat',
      availableHours: '10:00 AM - 4:00 PM',
      consultationFee: 1500,
      isVerified: true,
    },
    {
      name: 'Dr. Meera Iyer',
      specialty: 'Dermatologist',
      clinicName: 'Skin & Hair Clinic',
      address: '401, TRADE VIEW, Tulloch Road, Apollo Bunder',
      city: 'Mumbai',
      state: 'Maharashtra',
      phone: '+91 98345 67890',
      rating: 4.6,
      reviewCount: 287,
      availableDays: 'Mon, Wed, Fri, Sat',
      availableHours: '11:00 AM - 6:00 PM',
      consultationFee: 800,
      isVerified: true,
    },
    {
      name: 'Dr. Suresh Patil',
      specialty: 'Pediatrician',
      clinicName: 'Patil Children Hospital',
      address: '24, Ranade Road, Dadar West',
      city: 'Mumbai',
      state: 'Maharashtra',
      phone: '+91 98987 65432',
      rating: 4.8,
      reviewCount: 445,
      availableDays: 'Mon-Sat',
      availableHours: '9:00 AM - 12:30 PM, 5:00 PM - 8:00 PM',
      consultationFee: 600,
      isVerified: true,
    },
    {
      name: 'Dr. Vikram Malhotra',
      specialty: 'Orthopedic',
      clinicName: 'Malhotra Orthopedic & Joint Center',
      address: '501, Hiranandani Gardens, Powai',
      city: 'Mumbai',
      state: 'Maharashtra',
      phone: '+91 98123 45678',
      rating: 4.7,
      reviewCount: 310,
      availableDays: 'Mon, Tue, Thu, Fri',
      availableHours: '10:00 AM - 3:00 PM',
      consultationFee: 1000,
      isVerified: true,
    },
    {
      name: 'Dr. Anjali Kulkarni',
      specialty: 'Neurologist',
      clinicName: 'NeuroCare Clinic',
      address: '7, Maker Bhavan No. 3, Arthur Bunder Road, Colaba',
      city: 'Mumbai',
      state: 'Maharashtra',
      phone: '+91 98567 89012',
      rating: 4.8,
      reviewCount: 267,
      availableDays: 'Mon, Wed, Fri',
      availableHours: '10:00 AM - 2:00 PM',
      consultationFee: 2000,
      isVerified: true,
    },
    {
      name: 'Dr. Sanjay Joshi',
      specialty: 'ENT Specialist',
      clinicName: 'Joshi ENT Clinic',
      address: '203, Kamala Mills Compound, Lower Parel',
      city: 'Mumbai',
      state: 'Maharashtra',
      phone: '+91 97654 32109',
      rating: 4.3,
      reviewCount: 156,
      availableDays: 'Mon-Sat',
      availableHours: '9:30 AM - 1:30 PM, 4:00 PM - 7:30 PM',
      consultationFee: 700,
      isVerified: true,
    },
  ]

  for (const doc of doctors) {
    await db.doctor.upsert({
      where: { id: `seed-doctor-${doc.specialty.toLowerCase().replace(/\s+/g, '-')}-${doc.name.split(' ').pop()?.toLowerCase()}` },
      update: doc,
      create: {
        id: `seed-doctor-${doc.specialty.toLowerCase().replace(/\s+/g, '-')}-${doc.name.split(' ').pop()?.toLowerCase()}`,
        ...doc,
      },
    })
  }

  console.log(`✅ Seeded ${doctors.length} doctors`)
}

async function seedArticles() {
  console.log('🌱 Seeding health articles...')

  const articles = [
    {
      id: 'seed-article-1',
      title: '10 Ways to Boost Your Immunity Naturally',
      summary: 'Discover simple yet powerful natural methods to strengthen your immune system and stay healthy year-round.',
      category: 'wellness',
      author: 'Medicine Finder Team',
      tags: 'immunity,wellness,natural-remedies,health-tips',
      isFeatured: true,
      content: `A strong immune system is your body's first line of defense against illnesses. While there is no magic pill to prevent all infections, several evidence-based lifestyle habits can significantly strengthen your natural defenses. Here are ten proven ways to boost your immunity naturally.

First, prioritize adequate sleep. Research consistently shows that adults who get 7-9 hours of quality sleep per night have stronger immune responses. During sleep, your body produces cytokines, proteins that help fight infection and inflammation. Chronic sleep deprivation, on the other hand, can reduce the production of these protective cytokines.

Second, eat a diet rich in fruits and vegetables. Citrus fruits, bell peppers, broccoli, garlic, ginger, and spinach are packed with vitamins C, E, and A, as well as antioxidants that support immune function. A diverse, colorful plate ensures you get a broad spectrum of nutrients.

Third, stay physically active. Moderate exercise like brisk walking, cycling, or swimming for 30 minutes a day can boost circulation and help immune cells move through your body more effectively. However, avoid overtraining, which can temporarily suppress immunity.

Fourth, manage stress levels. Chronic stress releases cortisol, which over time can weaken your immune response. Practices like meditation, deep breathing exercises, yoga, and spending time in nature can help keep stress hormones in check.

Fifth, stay hydrated. Water helps your lymphatic system carry white blood cells and other immune cells throughout your body. Aim for at least 8 glasses of water daily.

Sixth, limit added sugars. High sugar intake can impair white blood cell function for several hours after consumption. Choose whole fruits over fruit juices and opt for natural sweeteners in moderation.

Seventh, include fermented foods in your diet. Yogurt, kimchi, sauerkraut, and idli contain probiotics that support gut health, which is closely linked to immune function. A healthy gut microbiome is essential for a robust immune system.

Eighth, get enough vitamin D. Many Indians are deficient in vitamin D despite abundant sunshine. Spend 15-20 minutes in morning sunlight and consider vitamin D-rich foods like fortified milk, fatty fish, and egg yolks.

Ninth, avoid smoking and limit alcohol consumption. Both habits can significantly weaken your immune system and make you more susceptible to respiratory infections.

Finally, practice good hygiene. Regular handwashing with soap for at least 20 seconds, maintaining distance from sick individuals, and keeping your living spaces clean are simple but effective ways to reduce your risk of infection.

By incorporating these habits into your daily routine, you can build a resilient immune system that protects you throughout the year.`,
    },
    {
      id: 'seed-article-2',
      title: 'Understanding Common Cold: Prevention and Treatment',
      summary: 'A comprehensive guide to understanding, preventing, and treating the common cold effectively at home.',
      category: 'prevention',
      author: 'Medicine Finder Team',
      tags: 'common-cold,prevention,treatment,home-remedies',
      isFeatured: true,
      content: `The common cold is one of the most frequent illnesses worldwide, with adults averaging 2-3 colds per year and children even more. While rarely serious, it can be uncomfortable and disruptive. Understanding how colds spread and how to manage them can help you recover faster and protect those around you.

The common cold is caused by more than 200 different viruses, with rhinoviruses being the most common culprit. These viruses spread through respiratory droplets when an infected person coughs or sneezes, and by touching contaminated surfaces then touching your eyes, nose, or mouth. Cold viruses can survive on surfaces for several hours, making hand hygiene crucial.

Symptoms typically appear 1-3 days after exposure and include a runny or stuffy nose, sore throat, cough, mild headache, mild body aches, sneezing, and low-grade fever. Most colds resolve within 7-10 days, though a cough may linger for up to three weeks.

Prevention is always better than cure. Wash your hands frequently with soap and water for at least 20 seconds. Use hand sanitizer with at least 60% alcohol when soap is unavailable. Avoid close contact with people who are sick. Do not touch your face with unwashed hands. Keep frequently touched surfaces clean and disinfected.

For treatment, rest is the most important remedy. Your body needs energy to fight the virus, so get plenty of sleep and avoid strenuous activity. Stay well-hydrated with water, herbal teas, warm soups, and fresh fruit juices. Honey mixed with warm water and lemon can soothe a sore throat and suppress coughing. Nasal saline drops or sprays can help relieve congestion. Steam inhalation with a few drops of eucalyptus oil can open up blocked nasal passages.

Over-the-counter medications like paracetamol can help reduce fever and body aches. Decongestant nasal sprays should not be used for more than 3-5 days to avoid rebound congestion. Antibiotics are ineffective against colds since they only work against bacteria, not viruses.

Consult a doctor if you have a fever above 103°F (39.4°C), symptoms that last more than 10 days without improvement, severe sinus pain, shortness of breath, or wheezing. These could indicate a secondary bacterial infection or other complications that require medical attention.

Remember, building a strong immune system through good nutrition, regular exercise, adequate sleep, and stress management is your best long-term defense against the common cold and other infections.`,
    },
    {
      id: 'seed-article-3',
      title: 'Healthy Eating: A Complete Guide to Nutrition',
      summary: 'Master the fundamentals of balanced nutrition with practical tips for making healthier food choices every day.',
      category: 'nutrition',
      author: 'Medicine Finder Team',
      tags: 'nutrition,healthy-eating,diet,balanced-meals',
      isFeatured: false,
      content: `Nutrition forms the foundation of good health. What you eat directly impacts your energy levels, immune function, mood, and long-term disease risk. A balanced diet does not have to be complicated or restrictive. It is about making informed choices and building sustainable eating habits.

Macronutrients are the three main categories of nutrients that your body needs in large amounts. Carbohydrates are your primary energy source. Choose complex carbohydrates like whole wheat, brown rice, oats, and millets over refined grains. They provide sustained energy and are rich in fiber, which supports digestion. Proteins are essential for building and repairing tissues, producing enzymes and hormones, and supporting immune function. Include dal, paneer, curd, eggs, fish, and chicken in your meals. Aim for 0.8-1 gram of protein per kilogram of body weight. Fats are vital for hormone production, brain function, and absorption of fat-soluble vitamins. Choose healthy fats from nuts, seeds, olive oil, avocados, and fatty fish while limiting saturated and trans fats.

Micronutrients, including vitamins and minerals, are needed in smaller quantities but are equally important. Iron-rich foods like spinach, dates, and jaggery prevent anemia. Calcium from milk, curd, and ragi strengthens bones. Vitamin C from amla, citrus fruits, and capsicum boosts immunity. Iodine from iodized salt supports thyroid function.

The Indian thali is an excellent example of a balanced meal when done right. Fill half your plate with vegetables and salads, a quarter with protein-rich foods like dal or curd, and a quarter with complex carbohydrates like roti or brown rice. This simple visual guide ensures you get a good mix of nutrients at every meal.

Practical tips for healthier eating include planning meals in advance to avoid last-minute unhealthy choices, cooking at home more often to control ingredients and portions, reading food labels to make informed decisions, eating slowly and mindfully to recognize hunger and fullness cues, and limiting processed foods, sugary drinks, and excessive salt.

Hydration is often overlooked but is a critical part of nutrition. Drink at least 8-10 glasses of water daily. Start your day with warm water, and carry a water bottle with you. Replace sugary sodas and packaged juices with buttermilk, coconut water, or nimbu pani for healthier alternatives.

Remember, there are no good or bad foods, only good and bad diets. Allow yourself occasional treats while maintaining an overall pattern of nutritious eating. Consistency is more important than perfection.`,
    },
    {
      id: 'seed-article-4',
      title: 'Exercise for Beginners: Start Your Fitness Journey',
      summary: 'A beginner-friendly guide to starting an exercise routine that is enjoyable, sustainable, and effective for overall health.',
      category: 'exercise',
      author: 'Medicine Finder Team',
      tags: 'exercise,fitness,beginners,workout,physical-activity',
      isFeatured: false,
      content: `Starting an exercise routine can feel overwhelming, but it does not have to be. Physical activity is one of the most powerful things you can do for your health, and even small amounts make a significant difference. Whether you want to lose weight, build strength, reduce stress, or simply feel more energetic, this guide will help you get started safely and enjoyably.

First, consult your doctor before beginning any new exercise program, especially if you have existing health conditions. Once cleared, start with activities you genuinely enjoy. Walking is one of the best exercises for beginners. It requires no equipment, can be done anywhere, and is gentle on your joints. Aim for a 20-30 minute brisk walk five days a week. As your fitness improves, you can gradually increase the pace and duration.

Create a realistic schedule. Consistency matters more than intensity when you are starting out. Three sessions per week of 30 minutes each is far more beneficial than one exhausting session followed by six days of inactivity. Choose a specific time that works for your daily routine, whether it is early morning, during a lunch break, or in the evening.

Warm up before every session with 5-10 minutes of light activity like marching in place, arm circles, or gentle stretching. This prepares your muscles and joints and reduces the risk of injury. Similarly, cool down after exercise with slow walking and static stretches.

As a beginner, focus on three types of exercise. Cardiovascular exercise like walking, cycling, or swimming strengthens your heart and lungs. Strength training, even with bodyweight exercises like squats, push-ups, and lunges, builds muscle and increases metabolism. Flexibility exercises like yoga or simple stretching improve range of motion and reduce stiffness.

Listen to your body. Mild muscle soreness a day or two after exercise is normal, but sharp pain during exercise is not. If something hurts, stop and modify the movement. Rest days are essential for recovery and muscle repair.

Track your progress to stay motivated. Keep a simple log of your activities, duration, and how you felt. Celebrate small milestones like completing your first full week or walking a little farther than before. Consider finding a workout buddy for accountability and social motivation.

Common barriers like lack of time can be overcome with short 10-15 minute sessions spread throughout the day. Lack of motivation can be addressed by setting specific, achievable goals and rewarding yourself for consistency. Remember, the best exercise is the one you will actually do regularly. Start small, be patient with yourself, and enjoy the process of getting stronger and healthier.`,
    },
    {
      id: 'seed-article-5',
      title: 'Managing Stress in Daily Life',
      summary: 'Practical strategies and techniques for identifying, understanding, and effectively managing everyday stress.',
      category: 'mental-health',
      author: 'Medicine Finder Team',
      tags: 'stress,mental-health,wellness,mindfulness,relaxation',
      isFeatured: false,
      content: `Stress is an inevitable part of modern life, but chronic stress can seriously impact your physical and mental health. It can lead to headaches, muscle tension, digestive problems, sleep disturbances, weakened immunity, anxiety, and depression. Learning to manage stress effectively is not just about feeling better in the moment but about protecting your long-term health.

The first step in managing stress is recognizing your stress signals. These vary from person to person but commonly include irritability, difficulty concentrating, fatigue, changes in appetite, teeth grinding, and a feeling of being overwhelmed. Once you identify your triggers and signals, you can develop targeted coping strategies.

Deep breathing is one of the simplest and most effective stress-relief techniques. Try the 4-7-8 breathing method: breathe in through your nose for 4 seconds, hold for 7 seconds, and exhale slowly through your mouth for 8 seconds. Repeat this cycle 3-4 times. This activates your parasympathetic nervous system, which calms your body's stress response.

Regular physical activity is a powerful stress buster. Exercise releases endorphins, which are natural mood elevators. Even a 15-minute walk can significantly reduce stress levels. Yoga combines physical movement with breath control and meditation, making it particularly effective for stress management.

Time management plays a crucial role in reducing daily stress. Prioritize tasks using the Eisenhower Matrix, which categorizes tasks as urgent and important, important but not urgent, urgent but not important, or neither. Focus on important tasks first and learn to say no to non-essential commitments.

Mindfulness meditation involves focusing your attention on the present moment without judgment. Start with just 5 minutes a day, sitting comfortably and focusing on your breath. When your mind wanders, gently bring it back. Regular practice can rewire your brain to respond more calmly to stressors.

Social connection is a powerful buffer against stress. Talking to a trusted friend or family member about what is bothering you can provide perspective and emotional support. Do not isolate yourself when you are feeling stressed.

Other effective strategies include maintaining a gratitude journal where you write down three things you are grateful for each day, engaging in hobbies and creative activities that you enjoy, limiting caffeine and alcohol intake which can exacerbate anxiety, and ensuring you get 7-9 hours of quality sleep.

If stress becomes overwhelming and starts interfering with your daily functioning, do not hesitate to seek professional help from a counselor or therapist. Mental health professionals can provide evidence-based treatments like Cognitive Behavioral Therapy (CBT) that are highly effective for stress management.`,
    },
    {
      id: 'seed-article-6',
      title: 'Seasonal Health Tips for Monsoon',
      summary: 'Essential health tips to stay safe and healthy during the monsoon season, covering diet, hygiene, and disease prevention.',
      category: 'seasonal',
      author: 'Medicine Finder Team',
      tags: 'monsoon,seasonal-health,hygiene,prevention',
      isFeatured: false,
      content: `The monsoon season brings welcome relief from the summer heat but also brings a host of health challenges. Increased humidity, stagnant water, and contaminated food and water can lead to various illnesses. Here are essential tips to stay healthy during the rainy season.

Waterborne diseases like cholera, typhoid, jaundice, and gastroenteritis are common during monsoons. Always drink boiled, filtered, or purified water. Avoid drinking water from outside sources. When eating out, opt for bottled water. At home, ensure your water purifier is serviced and functioning properly.

Mosquito-borne diseases like dengue, malaria, and chikungunya peak during monsoons due to stagnant water breeding grounds. Eliminate stagnant water around your home by regularly cleaning coolers, flower pots, and empty containers. Use mosquito nets while sleeping, apply mosquito repellent cream, and wear long-sleeved clothing during evening hours. Consider using mosquito meshes on windows and doors.

Food safety is crucial during this season. Avoid street food, especially cut fruits, chaat, and pani puri, as they are highly susceptible to bacterial contamination. Eat freshly cooked, warm meals. Wash all fruits and vegetables thoroughly before consumption, ideally with a solution of potassium permanganate or vinegar. Avoid raw salads outside.

Fungal and bacterial skin infections are common due to high humidity. Keep your skin dry, especially between toes and in skin folds. Wear breathable cotton clothing. Change out of wet clothes and shoes immediately. Use anti-fungal powder if you are prone to skin infections. Avoid walking in puddles or dirty water.

Respiratory infections increase during monsoons. Keep warm when it rains and avoid getting drenched. If you do get wet, take a warm shower immediately and change into dry clothes. Drink warm herbal teas with ginger, tulsi, and honey. Steam inhalation can help clear congested airways.

Boost your immunity with seasonal foods. Include turmeric milk (haldi doodh) in your daily routine. Eat seasonal fruits like jamun, litchi, and pomegranate. Consume probiotic-rich foods like curd and buttermilk to maintain gut health. Garlic, which has natural antibacterial properties, should be included in your cooking.

Keep your home clean and dry. Use a dehumidifier if possible. Ensure proper ventilation to prevent mold growth. Disinfect frequently touched surfaces. Wash bedding and curtains regularly to prevent dust mites and mold.

If you experience symptoms like persistent fever, severe diarrhea, vomiting, body aches, or skin rashes, consult a doctor promptly. Early treatment can prevent complications. Keep a basic first-aid kit with oral rehydration salts, paracetamol, and antiseptic cream at home.`,
    },
    {
      id: 'seed-article-7',
      title: 'Diabetes Management: Lifestyle Changes That Work',
      summary: 'Practical and proven lifestyle modifications for effectively managing diabetes and improving overall quality of life.',
      category: 'prevention',
      author: 'Medicine Finder Team',
      tags: 'diabetes,lifestyle,prevention,blood-sugar,health-management',
      isFeatured: false,
      content: `India is often called the diabetes capital of the world, with over 77 million people affected by Type 2 diabetes. While genetics play a role, lifestyle factors are the primary drivers. The good news is that lifestyle modifications can effectively manage and sometimes even reverse Type 2 diabetes in its early stages.

Dietary management is the cornerstone of diabetes control. Focus on foods with a low glycemic index (GI) that cause a slower, more gradual rise in blood sugar. Replace white rice with brown rice, quinoa, or millets like ragi and jowar. Choose whole grain roti over maida-based breads. Include plenty of fiber-rich vegetables like bitter gourd, spinach, beans, and broccoli. Eat protein with every meal to slow sugar absorption.

Meal timing matters as much as food choices. Eat at regular intervals to maintain stable blood sugar levels. Do not skip breakfast, as it helps regulate blood sugar for the rest of the day. Consider smaller, more frequent meals rather than three large ones. Portion control is essential. Use a smaller plate, fill half with vegetables, a quarter with protein, and a quarter with complex carbohydrates.

Regular physical activity improves insulin sensitivity, meaning your cells can better use available insulin to absorb glucose. Aim for at least 150 minutes of moderate-intensity exercise per week. This can include brisk walking, cycling, swimming, or yoga. Resistance training twice a week helps build muscle, which acts as a glucose reservoir. Even a 10-minute walk after meals can significantly reduce post-meal blood sugar spikes.

Stress management is often overlooked but critically important. Stress hormones like cortisol and adrenaline raise blood sugar levels. Practice relaxation techniques such as deep breathing, meditation, or yoga. Even 10 minutes of daily mindfulness practice can make a measurable difference.

Sleep quality directly affects blood sugar control. Poor sleep increases insulin resistance and cravings for sugary foods. Aim for 7-8 hours of quality sleep. Maintain a consistent sleep schedule, avoid screens before bedtime, and keep your bedroom cool and dark.

Regular monitoring is essential. Check your blood sugar levels as recommended by your doctor. Keep a log of your readings along with your meals, exercise, and stress levels. This helps identify patterns and triggers. Get HbA1c tests every three months to assess your average blood sugar control over time.

Medication adherence is crucial. Take your prescribed medications consistently and at the right times. Never adjust your dosage without consulting your doctor. Regular check-ups with your healthcare provider help catch and address complications early.

Quit smoking and limit alcohol consumption. Both can worsen diabetes complications and make blood sugar management more difficult. Stay hydrated by drinking plenty of water throughout the day, as dehydration can concentrate blood sugar levels.`,
    },
    {
      id: 'seed-article-8',
      title: 'Sleep Hygiene: How to Get Better Sleep',
      summary: 'Science-backed strategies to improve your sleep quality and establish healthy sleep habits for optimal health.',
      category: 'mental-health',
      author: 'Medicine Finder Team',
      tags: 'sleep,mental-health,wellness,sleep-hygiene,health-tips',
      isFeatured: false,
      content: `Quality sleep is as essential to health as nutrition and exercise, yet millions of people struggle with poor sleep. Poor sleep is linked to weight gain, weakened immunity, mood disorders, cognitive decline, and increased risk of chronic diseases including diabetes and heart disease. The good news is that most sleep problems can be resolved through better sleep hygiene, which refers to the habits and practices that promote consistent, quality sleep.

Maintain a consistent sleep schedule. Go to bed and wake up at the same time every day, including weekends. This reinforces your body's circadian rhythm, making it easier to fall asleep and wake up naturally. Most adults need 7-9 hours of sleep per night. Determine your ideal sleep window and stick to it.

Create an ideal sleep environment. Your bedroom should be dark, quiet, and cool. Use blackout curtains or an eye mask to block light. Use earplugs or a white noise machine if noise is an issue. Keep room temperature between 18-22 degrees Celsius. Invest in a comfortable mattress and pillows that support your sleeping position.

Limit screen time before bed. The blue light emitted by phones, tablets, computers, and televisions suppresses melatonin production, the hormone that regulates sleep. Stop using screens at least one hour before bedtime. Instead, read a physical book, listen to calming music, practice gentle stretching, or do breathing exercises.

Watch what you consume in the evening. Avoid caffeine after 2 PM as its effects can last for 6-8 hours. Do not consume alcohol before bed as it disrupts sleep architecture, reducing restorative deep sleep. Avoid heavy, spicy, or acidic meals within 3 hours of bedtime, as they can cause discomfort and acid reflux. If you are hungry, a light snack like a banana or warm milk can promote sleep.

Establish a relaxing pre-sleep routine. This signals to your body that it is time to wind down. Consider taking a warm bath, practicing progressive muscle relaxation, writing in a gratitude journal, or doing light reading. The key is consistency so your brain associates these activities with sleep.

Exercise regularly but time it wisely. Regular physical activity improves sleep quality, but vigorous exercise within 2-3 hours of bedtime can be stimulating. Aim to finish intense workouts at least 3 hours before your planned sleep time. Gentle yoga or stretching in the evening can actually promote relaxation.

Manage daytime naps. If you need to nap, keep it to 20-30 minutes and before 3 PM. Long or late afternoon naps can interfere with nighttime sleep. If you find yourself relying on naps, it may indicate you are not getting enough quality sleep at night.

If you cannot fall asleep within 20 minutes of getting into bed, get up and do a quiet, non-stimulating activity in dim light until you feel sleepy. Staying in bed while frustrated creates a negative association with your bed. Return to bed only when sleepy.

If sleep problems persist despite following good sleep hygiene for several weeks, consult a doctor. Conditions like sleep apnea, restless leg syndrome, and chronic insomnia require professional evaluation and treatment. Do not self-medicate with over-the-counter sleep aids without medical guidance.`,
    },
  ]

  for (const article of articles) {
    await db.healthArticle.upsert({
      where: { id: article.id },
      update: article,
      create: article,
    })
  }

  console.log(`✅ Seeded ${articles.length} health articles`)
}

async function main() {
  console.log('🚀 Starting seed...')
  try {
    await seedDoctors()
    await seedArticles()
    console.log('🎉 Seed completed successfully!')
  } catch (error) {
    console.error('❌ Seed failed:', error)
    process.exit(1)
  } finally {
    await db.$disconnect()
  }
}

main()
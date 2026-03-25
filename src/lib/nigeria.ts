export const NIGERIAN_STATES = [
  { code: 'AB', name: 'Abia' },
  { code: 'AD', name: 'Adamawa' },
  { code: 'AK', name: 'Akwa Ibom' },
  { code: 'AN', name: 'Anambra' },
  { code: 'BA', name: 'Bauchi' },
  { code: 'BY', name: 'Bayelsa' },
  { code: 'BE', name: 'Benue' },
  { code: 'BO', name: 'Borno' },
  { code: 'CR', name: 'Cross River' },
  { code: 'DE', name: 'Delta' },
  { code: 'EB', name: 'Ebonyi' },
  { code: 'ED', name: 'Edo' },
  { code: 'EK', name: 'Ekiti' },
  { code: 'EN', name: 'Enugu' },
  { code: 'FC', name: 'Abuja (FCT)' },
  { code: 'GO', name: 'Gombe' },
  { code: 'IM', name: 'Imo' },
  { code: 'JI', name: 'Jigawa' },
  { code: 'KD', name: 'Kaduna' },
  { code: 'KN', name: 'Kano' },
  { code: 'KT', name: 'Katsina' },
  { code: 'KE', name: 'Kebbi' },
  { code: 'KO', name: 'Kogi' },
  { code: 'KW', name: 'Kwara' },
  { code: 'LA', name: 'Lagos' },
  { code: 'NA', name: 'Nasarawa' },
  { code: 'NI', name: 'Niger' },
  { code: 'OG', name: 'Ogun' },
  { code: 'ON', name: 'Ondo' },
  { code: 'OS', name: 'Osun' },
  { code: 'OY', name: 'Oyo' },
  { code: 'PL', name: 'Plateau' },
  { code: 'RI', name: 'Rivers' },
  { code: 'SO', name: 'Sokoto' },
  { code: 'TA', name: 'Taraba' },
  { code: 'YO', name: 'Yobe' },
  { code: 'ZA', name: 'Zamfara' },
];

export const NIGERIAN_LGAS: Record<string, string[]> = {
  AB: ['Aba North', 'Aba South', 'Arochukwu', 'Bende', 'Ikwuano', 'Isiala Ngwa North', 'Isiala Ngwa South', 'Isuikwuato', 'Obingwa', 'Ohafia', 'Osisioma', 'Ugwunagbo', 'Ukwa East', 'Ukwa West', 'Umuahia North', 'Umuahia South', 'Umu-Nneochi'],
  AD: ['Abadam', 'Askira-Uba', 'Bama', 'Banki', 'Bayo', 'Birom', 'Bling', 'Bogoro', 'Chukura', 'Demsa', 'Fufure', 'Ganye', 'Girei', 'Gombi', 'Guyuk', 'Hong', 'Jada', 'Karma', 'Kumbotso', 'Kungsm', 'Langtang North', 'Langtang South', 'Lau', 'Maduguri', 'Maiha', 'Mayo-Belwa', 'Michika', 'Mubi North', 'Mubi South', 'Numan', 'Shelleng', 'Song', 'Toungo', 'Yola South', 'Yola North'],
  AK: ['Abak', 'Eastern Obolo', 'Eket', 'Esit-Eket', 'Essien Udim', 'Etim-Ekpo', 'Etinan', 'Ibeno', 'Ibesikpo-Asutan', 'Ibiono-Ibom', 'Ika', 'Ikono', 'Ikot Abasi', 'Ikot Ekpene', 'Ini', 'Itu', 'Mbo', 'Mkpat-Enin', 'Nsit-Atai', 'Nsit-Ibom', 'Nsit-Ubium', 'Obot-Akara', 'Okobo', 'Onna', 'Oron', 'Oruk Anam', 'Udung-Uko', 'Ukanafun', 'Uruan', 'Urue-Offong/Oruko', 'Uyo'],
  AN: ['Aguata', 'Anambra East', 'Anambra West', 'Awka North', 'Awka South', 'Ayamelum', 'Dunukofia', 'Ekwusigo', 'Idemili North', 'Idemili South', 'Ihiala', 'Njikoka', 'Nnewi North', 'Nnewi South', 'Ogbaru', 'Onitsha North', 'Onitsha South', 'Orumba North', 'Orumba South', 'Oyi'],
  BA: ['Alkaleri', 'Bauchi', 'Bogoro', 'Damban', 'Darako', 'Darako', 'Fija', 'Ganjuwa', 'Giade', 'Itas/Gadau', 'Jama\'are', 'Katagum', 'Kirfi', 'Misau', 'Ningi', 'Shira', 'Tafawa Balewa', 'Toro', 'Warji', 'Zaki'],
  BY: ['Brass', 'Ekeremor', 'Kolokuma/Opokuma', 'Nembe', 'Ogbia', 'Sagbama', 'Southern Ijaw', 'Yenagoa'],
  BE: ['Ado', 'Agatu', 'Apa', 'Buruku', 'Gboko', 'Guma', 'Gwer East', 'Gwer West', 'Katsina-Ala', 'Konshisha', 'Kwande', 'Logo', 'Makurdi', 'Obi', 'Ogbadibo', 'Oju', 'Okpokwu', 'Oturkpo', 'Tarka', 'Ukum', 'Ushongo', 'Vandeikya'],
  BO: ['Abadam', 'Askira-Uba', 'Bama', 'Banki', 'Bayo', 'Birom', 'Bling', 'Bogoro', 'Chukura', 'Demsa', 'Fufure', 'Ganye', 'Girei', 'Gombi', 'Guyuk', 'Hong', 'Jada', 'Karma', 'Kumbotso', 'Kungsm', 'Langtang North', 'Langtang South', 'Lau', 'Maduguri', 'Maiha', 'Mayo-Belwa', 'Michika', 'Mubi North', 'Mubi South', 'Numan', 'Shelleng', 'Song', 'Toungo', 'Yola South', 'Yola North'],
  CR: ['Abi', 'Akamkpa', 'Akpabuyo', 'Bekwarra', 'Biase', 'Boki', 'Calabar Municipal', 'Calabar South', 'Etung', 'Ikom', 'Obanliku', 'Obudu', 'Odukpani', 'Ogoja', 'Yakkur', 'Yala'],
  DE: ['Aniocha North', 'Aniocha South', 'Bomadi', 'Burutu', 'Delta', 'Ethiope East', 'Ethiope West', 'Ika North East', 'Ika South', 'Isoko North', 'Isoko South', 'Ndokwa East', 'Ndokwa West', 'Okpe', 'Oshimili North', 'Oshimili South', 'Patani', 'Sapele', 'Udu', 'Ughelli North', 'Ughelli South', 'Ukwuani', 'Warri North', 'Warri South', 'Warri South West'],
  EB: ['Abakaliki', 'Afikpo North', 'Afikpo South', 'Ebonyi', 'Ezza North', 'Ezza South', 'Ikwo', 'Ishielu', 'Ivo', 'Izzi', 'Ohaozara', 'Ohaukwu', 'Onicha'],
  ED: ['Egor', 'Esan Central', 'Esan North-East', 'Esan South-East', 'Esan West', 'Etsako Central', 'Etsako East', 'Etsako West', 'Igueben', 'Ikpoba-Okha', 'Orhionmwon', 'Oredo', 'Ovia North-East', 'Ovia South-West', 'Owan East', 'Owan West', 'Uhunmwonde'],
  EK: ['Ado Ekiti', 'Aiyekire (Gbonyin)', 'Ekiti East', 'Ekiti South-West', 'Ekiti West', 'Emure', 'Ido-Osi', 'Ijero', 'Ikere Ekiti', 'Ikole', 'Ilejemeje', 'Irepodun/Ifelodun', 'Ise/Orun', 'Moba', 'Oye'],
  EN: ['Aninri', 'Awgu', 'Enugu East', 'Enugu North', 'Enugu South', 'Ezeagu', 'Igbo Etiti', 'Igbo Eze North', 'Igbo Eze South', 'Isi Uzo', 'Nkanu East', 'Nkanu West', 'Nsukka', 'Oji River', 'Udenu', 'Udi Ngwo', 'Uzo-Uwani'],
  FC: ['Abaji', 'Bwari', 'Gwagwalada', 'Kuje', 'Kwali', 'Municipal Area Council'],
  GO: ['Balanga', 'Billiri', 'Dukku', 'Funakaye', 'Gombe', 'Kaltungo', 'Kwami', 'Nafada', 'Shongom', 'Yamaltu/Deba'],
  IM: ['Aboh Mbaise', 'Ahiazu Mbaise', 'Ehime Mbano', 'Ehim', 'Ezedib', 'Ezinihitte', 'Ideato North', 'Ideato South', 'Ihitte/Uboma', 'Ikeduru', 'Isiala Mbano', 'Isu', 'Mbaitoli', 'Ngor Okpala', 'Njaba', 'Nkwere', 'Obowo', 'Oguta', 'Ohaji/Egbema', 'Okigwe', 'Orlu', 'Orsu', 'Oru East', 'Oru West', 'Owerri Municipal', 'Owerri North', 'Owerri West', 'Unuimo'],
  JI: ['Auyo', 'Babura', 'Birnin Kudu', 'Birniwa', 'Bujin', 'Dutse', 'Gagarawa', 'Garki', 'Gumel', 'Gwagwarmawa', 'Hadejia', 'Jahun', 'Kafin Madaki', 'Kaugama', 'Kazaure', 'Kiri Kasamma', 'Kiyawa', 'Maigatari', 'Malam Madori', 'Miga', 'Ringim', 'Roni', 'Sule Tankarkar', 'Taura'],
  KD: ['Birnin-Gwari', 'Chikun', 'Giwa', 'Igabi', 'Ikara', 'Jaba', 'Jema\'a', 'Kachia', 'Kaduna North', 'Kaduna South', 'Kagarko', 'Kajuru', 'Kaura', 'Kauru', 'Kubau', 'Kudan', 'Lere', 'Makarfi', 'Sabon Gari', 'Sanga', 'Soba', 'Zangon Kataf', 'Zaria'],
  KN: ['Albasu', 'Bagwai', 'Bebeji', 'Bichi', 'Bunkure', 'Dala', 'Dambatta', 'Dawakin Kudu', 'Dawakin Tofa', 'Doguwa', 'Fagge', 'Gaya', 'Gezawa', 'Gwale', 'Gwarzo', 'Kabo', 'Kano Municipal', 'Karaye', 'Kibiya', 'Kiru', 'Kumbotso', 'Kunchi', 'Kura', 'Madobi', 'Makoda', 'Minjibir', 'Nasarawa', 'Rano', 'Rimin Gado', 'Rogo', 'Shanono', 'Sumaila', 'Takali', 'Tarauni', 'Tofa', 'Tsanyawa', 'Tudun Wada', 'Ungogo', 'Warawa', 'Wudil'],
  KT: ['Bakori', 'Batagarawa', 'Batsari', 'Baure', 'Bindawa', 'Charanchi', 'Dandume', 'Danja', 'Dan Musa', 'Daura', 'Dutsi', 'Dutsin-Ma', 'Faskari', 'Funtua', 'Ingawa', 'Jibia', 'Kafur', 'Kaita', 'Kankara', 'Kankia', 'Katsina', 'Katsina', 'Kurfi', 'Kusada', 'Mai\'Adua', 'Malumfashi', 'Mani', 'Mashi', 'Mikti', 'Musawa', 'Rimi', 'Sabuwa', 'Safana', 'Sandamu', 'Zango'],
  KE: ['Aleiro', 'Arewa', 'Argungu', 'Augie', 'Bagudo', 'Birnin Kebbi', 'Bunza', 'Dandi', 'Danko', 'Fakai', 'Gwandu', 'Jega', 'Kalgo', 'Koko/Besse', 'Maiyama', 'Ngaski', 'Sakaba', 'Shanga', 'Suru', 'Wasagu/Danko', 'Yauri', 'Zuru'],
  KO: ['Ajaokuta', 'Ankpa', 'Bassa', 'Dekina', 'Ibaji', 'Idah', 'Igalamela-Odolu', 'Igbi', 'Ijumu', 'Kabba/Bunu', 'Kogi', 'Lokoja', 'Ofu', 'Ogori/Magongo', 'Okehi', 'Okene', 'Olamaboro', 'Omala', 'Yagba East', 'Yagba West'],
  KW: ['Asa', 'Baruten', 'Edu', 'Ekiti', 'Ifelodun', 'Ilorin East', 'Ilorin South', 'Ilorin West', 'Irepodun', 'Isin', 'Kaiama', 'Moro', 'Offa', 'Oke-Ero', 'Oyun', 'Pategi'],
  LA: ['Agege', 'Ajeromi-Ifelodun', 'Alimosho', 'Amuwo-Odofin', 'Apapa', 'Badagry', 'Epe', 'Eti-Osa', 'Ibeju-Lekki', 'Ifako-Ijaiye', 'Ikeja', 'Ikorodu', 'Kosofe', 'Lagos Island', 'Lagos Mainland', 'Mushin', 'Ojo', 'Oshodi-Isolo', 'Shomolu', 'Surulere'],
  NA: ['Awe', 'Keana', 'Keffi', 'Kokona', 'Lafia', 'Nasarawo', 'Nasarawa', 'Nasarawa-Eggon', 'Obi', 'Toto', 'Wamba'],
  NI: ['Agaye', 'Bida', 'Bosso', 'Chanchaga', 'Edati', 'Gbako', 'Gurara', 'Katcha', 'Kontagora', 'Lapai', 'Lavun', 'Magama', 'Mariga', 'Mashegu', 'Mokwa', 'Moya', 'Paikoro', 'Rafi', 'Rijau', 'Shiroro', 'Suleja', 'Tafa', 'Wushishi'],
  OG: ['Abeokuta North', 'Abeokuta South', 'Ado-Odo/Ota', 'Egbado North', 'Egbado South', 'Ewekoro', 'Ifo', 'Ijebu East', 'Ijebu North', 'Ijebu North East', 'Ijebu Ode', 'Ikenne', 'Imeko-Afon', 'Ipokia', 'Obafemi Owode', 'Odeda', 'Odogbolu', 'Ogun Waterside', 'Remo North', 'Remo South', 'Shagamu'],
  ON: ['Akoko North-East', 'Akoko North-West', 'Akoko South-East', 'Akoko South-West', 'Akure North', 'Akure South', 'Ese-Odo', 'Idanre', 'Ifedore', 'Ilaje', 'Ile Oluji/Okeigbo', 'Irele', 'Odigbo', 'Okitipupa', 'Ondo', 'Ondo West', 'Ose', 'Owo'],
  OS: ['Atakumosa East', 'Atakumosa West', 'Aiyedaade', 'Aiyegunle', 'Boluwaduro', 'Boripe', 'Ede North', 'Ede South', 'Egbedore', 'Ejigbo', 'Ife Central', 'Ife East', 'Ife North', 'Ife South', 'Ila', 'Ilesha West', 'Irepodun', 'Irewole', 'Isokan', 'Iwo', 'Obokun', 'Odo-Otin', 'Ola Oluwa', 'Olorunda', 'Oriade', 'Oriola', 'Orolu', 'Osogbo'],
  OY: ['Afijio', 'Akinyele', 'Atiba', 'Atisbo', 'Egbeda', 'Ibadan Central', 'Ibadan North', 'Ibadan North-East', 'Ibadan North-West', 'Ibadan South-East', 'Ibadan South-West', 'Ibarapa Central', 'Ibarapa East', 'Ibarapa North', 'Ido', 'Irepo', 'Iseyin', 'Itesiwaju', 'Iwajowa', 'Kajola', 'Lagelu', 'Ogbomosho North', 'Ogbomosho South', 'Ogo Oluwa', 'Olorunsogo', 'Oluyole', 'Ona-Ara', 'Oorelope', 'Oyo', 'Oyo East', 'Saki East', 'Saki West', 'Surulere'],
  PL: ['Barkin Ladi', 'Bassa', 'Bokkos', 'Jos East', 'Jos North', 'Jos South', 'Kanam', 'Kanke', 'Langtang North', 'Langtang South', 'Mangu', 'Mikang', 'Pankshin', 'Qua\'an Pan', 'Riyom', 'Shendam', 'Wase'],
  RI: ['Abua/Odual', 'Ahoada East', 'Ahoada West', 'Akuku-Toru', 'Andoni', 'Asari-Toru', 'Bonny', 'Degema', 'Eleme', 'Emohua', 'Etche', 'Gokana', 'Ikwerre', 'Khana', 'Obio/Akpor', 'Ogba/Egbema/Ndoni', 'Ogu/Bolo', 'Okrika', 'Omuma', 'Opobo/Nkoro', 'Port Harcourt', 'Tai'],
  SO: ['Bodinga', 'Dange-Shuni', 'Gada', 'Goronyo', 'Gudu', 'Gwadabawa', 'Illela', 'Isa', 'Kebbe', 'Kware', 'Rabo', 'Sabon Birni', 'Shagari', 'Sokoto North', 'Sokoto South', 'Tambuwal', 'Tangaza', 'Tureta', 'Wamako', 'Wurno', 'Yabo'],
  TA: ['Bali', 'Donga', 'Gashaka', 'Gassol', 'Ibi', 'Jalingo', 'Karaye', 'Lau', 'Sardauna', 'Takum', 'Ussa', 'Wukari', 'Yorro', 'Zing'],
  YO: ['Bade', 'Bursari', 'Damaturu', 'Fika', 'Fune', 'Geidam', 'Gulani', 'Jakusko', 'Karasuwa', 'Machina', 'Nangere', 'Nguru', 'Potiskum', 'Tarmua', 'Yunusari', 'Yusufari'],
  ZA: ['Anka', 'Bakura', 'Birnin Magaji/Kiyaw', 'Bukkuyum', 'Bungudu', 'Gummi', 'Gusau', 'Kaura Namoda', 'Maradun', 'Maru', 'Shinkafi', 'Talata Mafara', 'Zurmi'],
};

export function getAllLocations() {
  const locations = [];
  
  for (const state of NIGERIAN_STATES) {
    const lgas = (NIGERIAN_LGAS as Record<string, string[]>)[state.code] || [];
    
    locations.push({
      stateCode: state.code,
      stateName: state.name,
      lgaCode: null,
      lgaName: null,
    });
    
    for (const lga of lgas) {
      const lgaCode = lga.substring(0, 3).toUpperCase().replace(/\s/g, '');
      locations.push({
        stateCode: state.code,
        stateName: state.name,
        lgaCode,
        lgaName: lga,
      });
    }
  }
  
  return locations;
}

export const NERDC_LEVELS = {
  PRE_NURSERY: { id: 'PRE_NURSERY', name: 'Pre-Nursery', minAge: 1, maxAge: 2 },
  NURSERY_1: { id: 'NURSERY_1', name: 'Nursery 1', minAge: 2, maxAge: 3 },
  NURSERY_2: { id: 'NURSERY_2', name: 'Nursery 2', minAge: 3, maxAge: 4 },
  PRIMARY_1: { id: 'PRIMARY_1', name: 'Primary 1 (Basic 1)', minAge: 4, maxAge: 5, nercd: 'BASIC_1' },
  PRIMARY_2: { id: 'PRIMARY_2', name: 'Primary 2 (Basic 2)', minAge: 5, maxAge: 6, nercd: 'BASIC_2' },
  PRIMARY_3: { id: 'PRIMARY_3', name: 'Primary 3 (Basic 3)', minAge: 6, maxAge: 7, nercd: 'BASIC_3' },
  PRIMARY_4: { id: 'PRIMARY_4', name: 'Primary 4 (Basic 4)', minAge: 7, maxAge: 8, nercd: 'BASIC_4' },
  PRIMARY_5: { id: 'PRIMARY_5', name: 'Primary 5 (Basic 5)', minAge: 8, maxAge: 9, nercd: 'BASIC_5' },
  PRIMARY_6: { id: 'PRIMARY_6', name: 'Primary 6 (Basic 6)', minAge: 9, maxAge: 10, nercd: 'BASIC_6' },
  JSS_1: { id: 'JSS_1', name: 'JSS 1 (Basic 7)', minAge: 10, maxAge: 11, nercd: 'BASIC_7' },
  JSS_2: { id: 'JSS_2', name: 'JSS 2 (Basic 8)', minAge: 11, maxAge: 12, nercd: 'BASIC_8' },
  JSS_3: { id: 'JSS_3', name: 'JSS 3 (Basic 9)', minAge: 12, maxAge: 13, nercd: 'BASIC_9' },
  SSS_1: { id: 'SSS_1', name: 'SSS 1 (Senior Secondary 1)', minAge: 13, maxAge: 14 },
  SSS_2: { id: 'SSS_2', name: 'SSS 2 (Senior Secondary 2)', minAge: 14, maxAge: 15 },
  SSS_3: { id: 'SSS_3', name: 'SSS 3 (Senior Secondary 3)', minAge: 15, maxAge: 16 },
};

export const NERDC_SUBJECTS = {
  CORE: [
    'Mathematics',
    'English Language',
    'Basic Science',
    'Social Studies',
    'Civic Education',
  ],
  LANGUAGES: [
    'Yoruba',
    'Igbo',
    'Hausa',
    'French',
  ],
  BEHAVIOURAL: [
    'Christian Religious Studies',
    'Islamic Studies',
    'Social Norms',
  ],
  NINE_JA: [
    'Nigerian History',
    'Geography',
    'Commerce',
    'Economics',
  ],
  PRACTICAL: [
    'Basic Technology',
    'Home Economics',
    'Agricultural Science',
    'Computer Studies',
  ],
  CREATIVE: [
    'Music',
    'Art',
    'Physical Education',
    'Health Education',
  ],
};

export function getSubjectsByLevel(level: number): { name: string; code: string }[] {
  const generateCode = (name: string) => name.substring(0, 4).toUpperCase().replace(/\s/g, '');
  
  if (level >= 0 && level <= 4) {
    return [
      { name: 'Basic Numeracy', code: 'BASC_NUM' },
      { name: 'Basic Literacy', code: 'BASC_LIT' },
      { name: 'Rhymes & Songs', code: 'RHYM' },
      { name: 'Art & Craft', code: 'ART' },
      { name: 'Physical Education', code: 'PE' },
    ];
  }
  
  if (level >= 5 && level <= 10) {
    return [
      { name: 'Mathematics', code: generateCode('Mathematics') },
      { name: 'English Language', code: generateCode('English Language') },
      { name: 'Basic Science', code: generateCode('Basic Science') },
      { name: 'Social Studies', code: generateCode('Social Studies') },
      { name: 'Civic Education', code: generateCode('Civic Education') },
      { name: 'Yoruba', code: generateCode('Yoruba') },
      { name: 'Igbo', code: generateCode('Igbo') },
      { name: 'Hausa', code: generateCode('Hausa') },
      { name: 'French', code: generateCode('French') },
      { name: 'Christian Religious Studies', code: generateCode('Christian Religious Studies') },
      { name: 'Islamic Studies', code: generateCode('Islamic Studies') },
      { name: 'Nigerian History', code: generateCode('Nigerian History') },
      { name: 'Geography', code: generateCode('Geography') },
      { name: 'Basic Technology', code: generateCode('Basic Technology') },
      { name: 'Computer Studies', code: generateCode('Computer Studies') },
      { name: 'Agricultural Science', code: generateCode('Agricultural Science') },
      { name: 'Music', code: generateCode('Music') },
      { name: 'Art', code: generateCode('Art') },
      { name: 'Physical Education', code: generateCode('Physical Education') },
      { name: 'Health Education', code: generateCode('Health Education') },
    ];
  }
  
  if (level >= 11 && level <= 13) {
    return [
      { name: 'Mathematics', code: generateCode('Mathematics') },
      { name: 'English Language', code: generateCode('English Language') },
      { name: 'Physics', code: 'PHY' },
      { name: 'Chemistry', code: 'CHEM' },
      { name: 'Biology', code: 'BIO' },
      { name: 'Social Studies', code: generateCode('Social Studies') },
      { name: 'Civic Education', code: generateCode('Civic Education') },
      { name: 'Yoruba', code: generateCode('Yoruba') },
      { name: 'Igbo', code: generateCode('Igbo') },
      { name: 'Hausa', code: generateCode('Hausa') },
      { name: 'French', code: generateCode('French') },
      { name: 'Christian Religious Studies', code: generateCode('Christian Religious Studies') },
      { name: 'Islamic Studies', code: generateCode('Islamic Studies') },
      { name: 'Nigerian History', code: generateCode('Nigerian History') },
      { name: 'Geography', code: generateCode('Geography') },
      { name: 'Commerce', code: generateCode('Commerce') },
      { name: 'Economics', code: generateCode('Economics') },
      { name: 'Basic Technology', code: generateCode('Basic Technology') },
      { name: 'Computer Studies', code: generateCode('Computer Studies') },
      { name: 'Agricultural Science', code: generateCode('Agricultural Science') },
      { name: 'Music', code: generateCode('Music') },
      { name: 'Art', code: generateCode('Art') },
      { name: 'Physical Education', code: generateCode('Physical Education') },
    ];
  }
  
  if (level >= 14 && level <= 16) {
    return [
      { name: 'Mathematics', code: generateCode('Mathematics') },
      { name: 'English Language', code: generateCode('English Language') },
      { name: 'Physics', code: 'PHY' },
      { name: 'Chemistry', code: 'CHEM' },
      { name: 'Biology', code: 'BIO' },
      { name: 'Civic Education', code: generateCode('Civic Education') },
      { name: 'Yoruba', code: generateCode('Yoruba') },
      { name: 'Igbo', code: generateCode('Igbo') },
      { name: 'Hausa', code: generateCode('Hausa') },
      { name: 'French', code: generateCode('French') },
      { name: 'Christian Religious Studies', code: generateCode('Christian Religious Studies') },
      { name: 'Islamic Studies', code: generateCode('Islamic Studies') },
      { name: 'Literature in English', code: 'LIT' },
      { name: 'Nigerian History', code: generateCode('Nigerian History') },
      { name: 'Geography', code: generateCode('Geography') },
      { name: 'Commerce', code: generateCode('Commerce') },
      { name: 'Economics', code: generateCode('Economics') },
      { name: 'Government', code: 'GOV' },
      { name: 'Accountancy', code: 'ACCT' },
      { name: 'Computer Studies', code: generateCode('Computer Studies') },
      { name: 'Agricultural Science', code: generateCode('Agricultural Science') },
      { name: 'Music', code: generateCode('Music') },
      { name: 'Art', code: generateCode('Art') },
      { name: 'Physical Education', code: generateCode('Physical Education') },
    ];
  }
  
  return [];
}

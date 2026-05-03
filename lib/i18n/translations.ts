// ============================================================================
// i18n — Bilingual translations EN/ID
// Add new keys here, used across all pages
// ============================================================================

export type Locale = 'en' | 'id';

export const translations = {
  en: {
    // ----- Nav -----
    'nav.apply': 'Apply',
    'nav.applications': 'applications',

    // ----- Hero -----
    'hero.eyebrow': 'Edition 01 · Bali Villa Connect 2026',
    'hero.title.line1': 'The CHA',
    'hero.title.line2': 'Hospitality',
    'hero.title.awards': 'Awards',
    'hero.presented_by': 'Presented by',
    'hero.powered_by': 'Powered by',
    'hero.lede':
      'Three winners. One stage. The most ambitious villa operators in Canggu get called up at Bali Villa Connect 2026 — in front of the entire industry.',
    'hero.cta_apply': 'Start your application →',
    'hero.cta_prize': "What's at stake",
    'hero.stat.applications': 'Applications',
    'hero.stat.winners': 'Winners',
    'hero.stat.finalists': 'Finalists',
    'hero.stat.deadline': 'Deadline',

    // ----- Categories -----
    'cat.section_eyebrow': '01 — The Categories',
    'cat.title.line1': 'Three categories.',
    'cat.title.line2': 'Three',
    'cat.title.winners': 'winners',
    'cat.lede':
      'Hosting in Canggu looks different at every scale. So we\'re picking one winner per stage of growth.',
    'cat.boutique.name': 'The independent host',
    'cat.boutique.desc': 'For the owner-operator scaling up',
    'cat.boutique.range': '1 — 3 villas',
    'cat.growing.name': 'The complexity threshold',
    'cat.growing.desc': 'Where things start breaking',
    'cat.growing.range': '4 — 9 villas',
    'cat.scaled.name': 'The professional operator',
    'cat.scaled.desc': 'Running real operations',
    'cat.scaled.range': '10+ villas',
    'cat.villas': 'villas',

    // ----- Tiers -----
    'tier.top.label': 'Top — Winners',
    'tier.top.headline': '1 year Elev8 Suite OS + onboarding',
    'tier.top.desc':
      'Annual subscription for 2 villas plus personal onboarding & live data migration. Plus the stage moment at Villa Connect 2026.',
    'tier.top.value': 'USD 2,155 value',
    'tier.finalists.label': 'Finalists',
    'tier.finalists.headline': 'Free Villa Connect ticket',
    'tier.finalists.desc':
      'Complimentary pass to Bali Villa Connect 2026. Reserved finalist seating. Named in the on-stage reveal.',
    'tier.recognized.label': 'Recognized',
    'tier.recognized.headline': '1:1 strategy session',
    'tier.recognized.desc':
      '30-minute audit with Elev8 Suite OS founders. Tailored feedback on your operations. No sales pitch.',

    // ----- Stage -----
    'stage.eyebrow': 'The Showpiece',
    'stage.title.line1': 'Stand on the',
    'stage.title.stage': 'stage',
    'stage.text':
      '26 — 27 May. Bali Villa Connect 2026 — the room where every villa operator on the island gathers. Pak Prima Hartawan, founder of the CHA, calls up the three winners. The platform money cannot buy.',

    // ----- Application Form -----
    'apply.section_eyebrow': '04 — Your application',
    'apply.title.line1': 'Two ways',
    'apply.title.line2': 'to',
    'apply.title.apply': 'apply',
    'apply.lede':
      'Short for the busy. Deep for the ambitious. Both count.',
    'apply.quick.tag': 'Quick Apply',
    'apply.quick.name': 'Get on the list',
    'apply.quick.time': '~ 3 min',
    'apply.quick.desc':
      'Basics about you and your business. Save and continue anytime.',
    'apply.deep.tag': 'Deep Story',
    'apply.deep.name': 'Make your case',
    'apply.deep.time': '~ 12 min',
    'apply.deep.desc':
      'Quick Apply + your story, current setup, and what you\'d attack with Elev8 Suite OS.',

    // ----- Form Fields -----
    'form.step': 'Step',
    'form.of': 'of',
    'form.continue': 'Continue →',
    'form.back': '← Back',
    'form.submit': 'Submit application',
    'form.save_continue': 'Save & continue later',

    'field.full_name': 'Your full name',
    'field.business_name': 'Business or brand name',
    'field.email': 'Email',
    'field.whatsapp': 'WhatsApp number',
    'field.location': 'Where in Bali?',
    'field.attending_villa_connect': 'Attending Villa Connect 2026?',
    'field.villa_count': 'How many villas do you operate?',
    'field.years_hosting': 'Years hosting',
    'field.team_size': 'Team size',
    'field.occupancy_pct': 'Average occupancy (last 6 months)',
    'field.channels': 'Booking channels',
    'field.current_tools': 'What tools do you use today?',
    'field.current_tools_pros': 'What works well?',
    'field.current_tools_cons': 'What doesn\'t?',
    'field.biggest_headache': 'Your biggest operational headache right now',
    'field.first_attack': 'What would you attack first with Elev8 Suite OS?',
    'field.twelve_month_vision': 'Where do you want to be in 12 months?',
    'field.why_you': 'Why you?',

    // ----- Voting Page (written from APPLICANT's first-person perspective,
    //                   since they share this page with their network) -----
    'vote.title': 'Vote for',
    'vote.cast_vote': 'Cast your vote',
    'vote.you_voted': "You've voted",
    'vote.share_help': 'Help us win',
    'vote.deadline': 'Voting closes',
    'vote.current_position': 'Currently #',
    'vote.in_category': 'in',
    'vote.share_whatsapp': 'Share on WhatsApp',
    'vote.share_linkedin': 'Share on LinkedIn',
    'vote.copy_link': 'Copy link',
    'vote.link_copied': 'Link copied!',
    'vote.story_title': 'Our story',
    'vote.headache_label': 'Our biggest headache',
    'vote.attack_label': 'Our first move with Elev8 Suite OS',
    'vote.vision_label': 'Our 12-month vision',
    'vote.discover_others': 'Discover other applicants',
    'vote.about_awards': 'About the Awards',

    // ----- Hero extra (PartnershipStrip) -----
    'hero.hosted_at': 'Hosted at',

    // ----- Stage Section -----
    'stage.dates': '26 — 27 May 2026',
    'stage.venue': 'Bali Sunset Road Convention Center',
    'stage.live_reveal': 'Live Reveal',

    // ----- Final CTA -----
    'cta.title.before': 'Ready to make',
    'cta.title.your': 'your',
    'cta.title.case': 'case',
    'cta.lede': 'Three minutes for Quick Apply. Twelve for the full story. Either way, you\'re in.',

    // ----- Jury Section -----
    'jury.eyebrow': '02 — The Jury',
    'jury.title.part1': 'Selected by',
    'jury.title.peers': 'peers',
    'jury.title.part2': 'not vendors.',
    'jury.lede': 'A four-person jury of senior hospitality leaders. Public criteria, public weights, public process.',
    'jury.criteria.story.name': 'Story',
    'jury.criteria.story.desc': 'The most honest, specific account of where you are and what you\'re up against.',
    'jury.criteria.growth.name': 'Growth Potential',
    'jury.criteria.growth.desc.before': 'What 1 year of',
    'jury.criteria.growth.desc.after': 'could realistically unlock for your business.',
    'jury.criteria.community.name': 'Community Wildcard',
    'jury.criteria.community.desc': 'One winner is chosen by a community vote within the CHA group.',

    // ----- Footer -----
    'footer.tagline': 'The annual awards celebrating Canggu\'s most ambitious villa operators. Edition 01 — May 2026.',
    'footer.col.awards': 'Awards',
    'footer.col.connect': 'Connect',
    'footer.link.categories': 'Categories',
    'footer.link.apply': 'Apply',
    'footer.copyright': '© 2026 Canggu Hospitality Association',
    'footer.edition': 'Edition 01 — CHA Hospitality Awards · Powered by',

    // ----- Common -----
    'common.loading': 'Loading...',
    'common.error': 'Something went wrong. Please try again.',
    'common.success': 'Success!',
  },

  id: {
    // ----- Nav -----
    'nav.apply': 'Daftar',
    'nav.applications': 'pendaftar',

    // ----- Hero -----
    'hero.eyebrow': 'Edisi 01 · Bali Villa Connect 2026',
    'hero.title.line1': 'CHA',
    'hero.title.line2': 'Hospitality',
    'hero.title.awards': 'Awards',
    'hero.presented_by': 'Diselenggarakan oleh',
    'hero.powered_by': 'Didukung oleh',
    'hero.lede':
      'Tiga pemenang. Satu panggung. Operator villa paling ambisius di Canggu akan dipanggil di Bali Villa Connect 2026 — di depan seluruh industri.',
    'hero.cta_apply': 'Mulai pendaftaran →',
    'hero.cta_prize': 'Apa yang ditawarkan',
    'hero.stat.applications': 'Pendaftar',
    'hero.stat.winners': 'Pemenang',
    'hero.stat.finalists': 'Finalis',
    'hero.stat.deadline': 'Batas waktu',

    // ----- Categories -----
    'cat.section_eyebrow': '01 — Kategori',
    'cat.title.line1': 'Tiga kategori.',
    'cat.title.line2': 'Tiga',
    'cat.title.winners': 'pemenang',
    'cat.lede':
      'Mengelola villa di Canggu berbeda di setiap skala. Karena itu kami memilih satu pemenang per tahap pertumbuhan.',
    'cat.boutique.name': 'Host independen',
    'cat.boutique.desc': 'Untuk pemilik-operator yang sedang berkembang',
    'cat.boutique.range': '1 — 3 villa',
    'cat.growing.name': 'Ambang kompleksitas',
    'cat.growing.desc': 'Di mana sistem mulai goyah',
    'cat.growing.range': '4 — 9 villa',
    'cat.scaled.name': 'Operator profesional',
    'cat.scaled.desc': 'Operasional bisnis nyata',
    'cat.scaled.range': '10+ villa',
    'cat.villas': 'villa',

    // ----- Tiers -----
    'tier.top.label': 'Top — Pemenang',
    'tier.top.headline': '1 tahun Elev8 Suite OS + onboarding',
    'tier.top.desc':
      'Langganan tahunan untuk 2 villa plus onboarding personal & migrasi data langsung. Termasuk momen panggung di Villa Connect 2026.',
    'tier.top.value': 'Senilai USD 2.155',
    'tier.finalists.label': 'Finalis',
    'tier.finalists.headline': 'Tiket Villa Connect gratis',
    'tier.finalists.desc':
      'Tiket gratis Bali Villa Connect 2026. Tempat duduk khusus finalis. Disebut dalam pengumuman panggung.',
    'tier.recognized.label': 'Diakui',
    'tier.recognized.headline': 'Sesi strategi 1:1',
    'tier.recognized.desc':
      'Audit 30 menit dengan founder Elev8 Suite OS. Feedback yang disesuaikan dengan operasional Anda. Tanpa pitch penjualan.',

    // ----- Stage -----
    'stage.eyebrow': 'Sorotan Utama',
    'stage.title.line1': 'Naik ke atas',
    'stage.title.stage': 'panggung',
    'stage.text':
      '26 — 27 Mei. Bali Villa Connect 2026 — tempat berkumpulnya seluruh operator villa di Bali. Pak Prima Hartawan, founder CHA, memanggil tiga pemenang. Panggung yang tidak bisa dibeli dengan uang.',

    // ----- Application Form -----
    'apply.section_eyebrow': '04 — Pendaftaran Anda',
    'apply.title.line1': 'Dua cara',
    'apply.title.line2': '',
    'apply.title.apply': 'mendaftar',
    'apply.lede':
      'Singkat untuk yang sibuk. Mendalam untuk yang ambisius. Keduanya valid.',
    'apply.quick.tag': 'Quick Apply',
    'apply.quick.name': 'Masuk daftar',
    'apply.quick.time': '~ 3 menit',
    'apply.quick.desc':
      'Info dasar tentang Anda dan bisnis. Bisa disimpan & dilanjutkan kapan saja.',
    'apply.deep.tag': 'Deep Story',
    'apply.deep.name': 'Sampaikan cerita Anda',
    'apply.deep.time': '~ 12 menit',
    'apply.deep.desc':
      'Quick Apply + cerita, setup saat ini, dan rencana Anda dengan Elev8 Suite OS.',

    // ----- Form Fields -----
    'form.step': 'Langkah',
    'form.of': 'dari',
    'form.continue': 'Lanjut →',
    'form.back': '← Kembali',
    'form.submit': 'Kirim pendaftaran',
    'form.save_continue': 'Simpan & lanjutkan nanti',

    'field.full_name': 'Nama lengkap Anda',
    'field.business_name': 'Nama bisnis atau brand',
    'field.email': 'Email',
    'field.whatsapp': 'Nomor WhatsApp',
    'field.location': 'Di mana di Bali?',
    'field.attending_villa_connect': 'Hadir di Villa Connect 2026?',
    'field.villa_count': 'Berapa villa yang Anda kelola?',
    'field.years_hosting': 'Sudah berapa tahun?',
    'field.team_size': 'Jumlah tim',
    'field.occupancy_pct': 'Rata-rata okupansi (6 bulan terakhir)',
    'field.channels': 'Saluran booking',
    'field.current_tools': 'Tools apa yang Anda gunakan sekarang?',
    'field.current_tools_pros': 'Apa yang berjalan baik?',
    'field.current_tools_cons': 'Apa yang tidak?',
    'field.biggest_headache': 'Masalah operasional terbesar Anda saat ini',
    'field.first_attack': 'Apa yang akan Anda tangani pertama dengan Elev8 Suite OS?',
    'field.twelve_month_vision': 'Di mana Anda ingin berada dalam 12 bulan?',
    'field.why_you': 'Mengapa Anda?',

    // ----- Voting Page (first-person — applicant shares with their network) -----
    'vote.title': 'Pilih',
    'vote.cast_vote': 'Berikan suara Anda',
    'vote.you_voted': 'Anda sudah memilih',
    'vote.share_help': 'Bantu kami menang',
    'vote.deadline': 'Voting ditutup',
    'vote.current_position': 'Saat ini #',
    'vote.in_category': 'di',
    'vote.share_whatsapp': 'Bagikan di WhatsApp',
    'vote.share_linkedin': 'Bagikan di LinkedIn',
    'vote.copy_link': 'Salin tautan',
    'vote.link_copied': 'Tautan disalin!',
    'vote.story_title': 'Cerita kami',
    'vote.headache_label': 'Tantangan terbesar kami',
    'vote.attack_label': 'Langkah pertama kami dengan Elev8 Suite OS',
    'vote.vision_label': 'Visi 12 bulan kami',
    'vote.discover_others': 'Lihat pendaftar lain',
    'vote.about_awards': 'Tentang Awards',

    // ----- Hero extra (PartnershipStrip) -----
    'hero.hosted_at': 'Diadakan di',

    // ----- Stage Section -----
    'stage.dates': '26 — 27 Mei 2026',
    'stage.venue': 'Bali Sunset Road Convention Center',
    'stage.live_reveal': 'Pengumuman Langsung',

    // ----- Final CTA -----
    'cta.title.before': 'Siap menyampaikan',
    'cta.title.your': 'kisah',
    'cta.title.case': 'Anda',
    'cta.lede': 'Tiga menit untuk Quick Apply. Dua belas menit untuk kisah lengkap. Apa pun pilihan Anda, Anda termasuk di dalamnya.',

    // ----- Jury Section -----
    'jury.eyebrow': '02 — Dewan Juri',
    'jury.title.part1': 'Dipilih oleh',
    'jury.title.peers': 'rekan sejawat',
    'jury.title.part2': 'bukan vendor.',
    'jury.lede': 'Empat juri dari pemimpin senior industri perhotelan. Kriteria publik, bobot publik, proses publik.',
    'jury.criteria.story.name': 'Kisah',
    'jury.criteria.story.desc': 'Cerita paling jujur dan spesifik tentang posisi Anda saat ini dan tantangan yang Anda hadapi.',
    'jury.criteria.growth.name': 'Potensi Pertumbuhan',
    'jury.criteria.growth.desc.before': 'Apa yang dapat dibuka oleh 1 tahun',
    'jury.criteria.growth.desc.after': 'untuk bisnis Anda secara realistis.',
    'jury.criteria.community.name': 'Wildcard Komunitas',
    'jury.criteria.community.desc': 'Satu pemenang dipilih melalui voting komunitas di grup CHA.',

    // ----- Footer -----
    'footer.tagline': 'Award tahunan yang merayakan operator villa paling ambisius di Canggu. Edisi 01 — Mei 2026.',
    'footer.col.awards': 'Awards',
    'footer.col.connect': 'Hubungi',
    'footer.link.categories': 'Kategori',
    'footer.link.apply': 'Daftar',
    'footer.copyright': '© 2026 Canggu Hospitality Association',
    'footer.edition': 'Edisi 01 — CHA Hospitality Awards · Didukung oleh',

    // ----- Common -----
    'common.loading': 'Memuat...',
    'common.error': 'Terjadi kesalahan. Silakan coba lagi.',
    'common.success': 'Berhasil!',
  },
} as const;

export type TranslationKey = keyof typeof translations.en;

export function t(key: TranslationKey, locale: Locale = 'en'): string {
  return translations[locale][key] || translations.en[key] || key;
}

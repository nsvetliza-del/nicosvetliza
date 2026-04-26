const optimizeCloudinaryVideo = (url) => {
  if (!url?.includes("/video/upload/")) return url;
  if (url.includes("/video/upload/f_auto,q_auto/")) return url;
  return url.replace("/video/upload/", "/video/upload/f_auto,q_auto/");
};

export const projects = [
  {
    id: "mi-primer-15",
    title: "Mi Primer 15",
    category: "Short Film / Documentary",
    type: "short-film",
    video: optimizeCloudinaryVideo("https://res.cloudinary.com/dlpmcvfva/video/upload/v1777178038/Mi_primer_15_liviano_qeszec.mp4"),
  },
  {
    id: "see-you",
    title: "See You",
    category: "Short Film / Documentary",
    type: "short-film",
    video: optimizeCloudinaryVideo("https://res.cloudinary.com/dlpmcvfva/video/upload/v1777177947/see_you_liviano_jrzslt.mp4"),
  },
  {
    id: "montonero",
    title: "Montonero",
    category: "Music Video",
    type: "music-video",
    video: optimizeCloudinaryVideo("https://res.cloudinary.com/dlpmcvfva/video/upload/v1777177853/montonero_liviano_s0rtny.mp4"),
  },
  {
    id: "cara-de-asco",
    title: "Cara de Asco",
    category: "Short Film / Documentary",
    type: "short-film",
    video: optimizeCloudinaryVideo("https://res.cloudinary.com/dlpmcvfva/video/upload/v1777177841/cara_de_asco_liviano_hsluud.mp4"),
  },
  {
    id: "como-una-rafaga",
    title: "Como una ráfaga de viento",
    category: "Short Film / Documentary",
    type: "short-film",
    video: optimizeCloudinaryVideo("https://res.cloudinary.com/dlpmcvfva/video/upload/v1777177825/rafaga_liviano_puzw5z.mp4"),
  },
  {
    id: "levis",
    title: "Levi’s",
    category: "Ads / Commercial / Fashion Film",
    type: "commercial",
    video: optimizeCloudinaryVideo("https://res.cloudinary.com/dlpmcvfva/video/upload/v1777177138/levis_znl9xk.mp4"),
  },
  {
    id: "lasal",
    title: "LASAL",
    category: "Short Film / Documentary",
    type: "short-film",
    video: optimizeCloudinaryVideo("https://res.cloudinary.com/dlpmcvfva/video/upload/v1777177133/LASAL_xwjypu.mp4"),
  },
  {
    id: "zelmira-ari",
    title: "Zelmira Ari",
    category: "Ads / Commercial / Fashion Film",
    type: "commercial",
    video: optimizeCloudinaryVideo("https://res.cloudinary.com/dlpmcvfva/video/upload/v1777177130/zelmira_ari_d7efem.mp4"),
  },
  {
    id: "midway-mid90s",
    title: "Midway 90s",
    category: "Ads / Commercial / Fashion Film",
    type: "commercial",
    video: optimizeCloudinaryVideo("https://res.cloudinary.com/dlpmcvfva/video/upload/v1777177132/midway_mid90s_lko6gw.mp4"),
  },
  {
    id: "zelmira-sumaq",
    title: "Zelmira Sumaq",
    category: "Ads / Commercial / Fashion Film",
    type: "commercial",
    video: optimizeCloudinaryVideo("https://res.cloudinary.com/dlpmcvfva/video/upload/v1777177129/zelmira_sumaq_duropq.mp4"),
  },
  {
    id: "la-rando",
    title: "La Rando",
    category: "Ads / Commercial / Fashion Film",
    type: "commercial",
    video: optimizeCloudinaryVideo("https://res.cloudinary.com/dlpmcvfva/video/upload/v1777177124/la-rando_kwxakd.mp4"),
  },
  {
    id: "yango",
    title: "Yango",
    category: "Ads / Commercial / Fashion Film",
    type: "commercial",
    video: optimizeCloudinaryVideo("https://res.cloudinary.com/dlpmcvfva/video/upload/v1777177120/yango_qhmevl.mp4"),
  },
  {
    id: "taekwondo",
    title: "Taekwondo",
    category: "Ads / Commercial / Fashion Film",
    type: "commercial",
    video: optimizeCloudinaryVideo("https://res.cloudinary.com/dlpmcvfva/video/upload/v1777177111/taekwondo_s3fyrg.mp4"),
  },
  {
    id: "miller",
    title: "Miller",
    category: "Ads / Commercial / Fashion Film",
    type: "commercial",
    video: optimizeCloudinaryVideo("https://res.cloudinary.com/dlpmcvfva/video/upload/v1777177093/miller_uvzc9i.mp4"),
  },
  {
    id: "midway-etereo",
    title: "Midway Etéreo",
    category: "Ads / Commercial / Fashion Film",
    type: "commercial",
    video: optimizeCloudinaryVideo("https://res.cloudinary.com/dlpmcvfva/video/upload/v1777177101/midway_etereo_gua662.mp4"),
  },
  {
    id: "vichy-zuzu",
    title: "Vichy Zuzu",
    category: "Ads / Commercial / Fashion Film",
    type: "commercial",
    video: optimizeCloudinaryVideo("https://res.cloudinary.com/dlpmcvfva/video/upload/v1777177084/Vichy_zuzu_po8u3i.mp4"),
  },
  {
    id: "el-director",
    title: "El Director",
    category: "Short Film / Documentary",
    type: "short-film",
    video: optimizeCloudinaryVideo("https://res.cloudinary.com/dlpmcvfva/video/upload/v1777177059/El_Director_pauqpq.mp4"),
  },
  {
    id: "ford-ranger",
    title: "Ford Ranger",
    category: "Ads / Commercial / Fashion Film",
    type: "commercial",
    video: optimizeCloudinaryVideo("https://res.cloudinary.com/dlpmcvfva/video/upload/v1777177051/ford_ranger_g9nhuy.mp4"),
  },
  {
    id: "ay-not-dead",
    title: "Ay Not Dead",
    category: "Ads / Commercial / Fashion Film",
    type: "commercial",
    video: optimizeCloudinaryVideo("https://res.cloudinary.com/dlpmcvfva/video/upload/v1777177049/ay-not-dead_ei2rqb.mp4"),
  },
  {
    id: "fungalia-1",
    title: "Fungalia I",
    category: "Ads / Commercial / Fashion Film",
    type: "commercial",
    video: optimizeCloudinaryVideo("https://res.cloudinary.com/dlpmcvfva/video/upload/v1777177048/fungalia_1_qmxdr0.mp4"),
  },
  {
    id: "florentina-2",
    title: "Florentina II",
    category: "Ads / Commercial / Fashion Film",
    type: "commercial",
    video: optimizeCloudinaryVideo("https://res.cloudinary.com/dlpmcvfva/video/upload/v1777177042/florentina-2_z8kcse.mp4"),
  },
  {
    id: "florentina-3",
    title: "Florentina III",
    category: "Ads / Commercial / Fashion Film",
    type: "commercial",
    video: optimizeCloudinaryVideo("https://res.cloudinary.com/dlpmcvfva/video/upload/v1777177040/florentina-3_rno1sn.mp4"),
  },
  {
    id: "florentina-1",
    title: "Florentina I",
    category: "Ads / Commercial / Fashion Film",
    type: "commercial",
    video: optimizeCloudinaryVideo("https://res.cloudinary.com/dlpmcvfva/video/upload/v1777177035/florentina-1_bo1b3e.mp4"),
  },
  {
    id: "adidas-1",
    title: "Adidas I",
    category: "Ads / Commercial / Fashion Film",
    type: "commercial",
    video: optimizeCloudinaryVideo("https://res.cloudinary.com/dlpmcvfva/video/upload/v1777177031/Adidas-1_ouxble.mp4"),
  },
  {
    id: "adidas-2",
    title: "Adidas II",
    category: "Ads / Commercial / Fashion Film",
    type: "commercial",
    video: optimizeCloudinaryVideo("https://res.cloudinary.com/dlpmcvfva/video/upload/v1777177030/Adidas-2_ytft5g.mp4"),
  },
  {
    id: "fungalia-2",
    title: "Fungalia II",
    category: "Ads / Commercial / Fashion Film",
    type: "commercial",
    video: optimizeCloudinaryVideo("https://res.cloudinary.com/dlpmcvfva/video/upload/v1777177029/fungalia_2_op4qpz.mp4"),
  },
];

export const categories = [
  "All",
  "Short Film / Documentary",
  "Music Video",
  "Ads / Commercial / Fashion Film",
];

export const getProjectById = (id) => {
  return projects.find((project) => project.id === id);
};

export default projects;

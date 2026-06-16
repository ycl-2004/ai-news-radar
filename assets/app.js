const state = {
  itemsAi: [],
  itemsAll: [],
  itemsAllRaw: [],
  statsAi: [],
  totalAi: 0,
  totalRaw: 0,
  totalAllMode: 0,
  allDedup: true,
  allDataLoaded: false,
  allDataUrl: "data/latest-24h-all.json",
  allDataPromise: null,
  siteFilter: "",
  query: "",
  mode: "ai",
  waytoagiMode: "today",
  waytoagiData: null,
  sourceStatus: null,
  generatedAt: null,
  dailyBrief: null,
  activeSection: "hot",
  boleView: "hot",
  boleExpanded: false,
};

const statsEl = document.getElementById("stats");
const siteSelectEl = document.getElementById("siteSelect");
const sitePillsEl = document.getElementById("sitePills");
const newsListEl = document.getElementById("newsList");
const updatedAtEl = document.getElementById("updatedAt");
const searchInputEl = document.getElementById("searchInput");
const resultCountEl = document.getElementById("resultCount");
const listTitleEl = document.getElementById("listTitle");
const itemTpl = document.getElementById("itemTpl");
const modeAiBtnEl = document.getElementById("modeAiBtn");
const modeAllBtnEl = document.getElementById("modeAllBtn");
const modeHintEl = document.getElementById("modeHint");
const allDedupeWrapEl = document.getElementById("allDedupeWrap");
const allDedupeToggleEl = document.getElementById("allDedupeToggle");
const allDedupeLabelEl = document.getElementById("allDedupeLabel");
const advancedSummaryEl = document.getElementById("advancedSummary");
const sourceHealthEl = document.getElementById("sourceHealth");

const waytoagiUpdatedAtEl = document.getElementById("waytoagiUpdatedAt");
const waytoagiMetaEl = document.getElementById("waytoagiMeta");
const waytoagiListEl = document.getElementById("waytoagiList");
const waytoagiTodayBtnEl = document.getElementById("waytoagiTodayBtn");
const waytoagi7dBtnEl = document.getElementById("waytoagi7dBtn");
const coverageStripEl = document.getElementById("coverageStrip");
const bolePicksListEl = document.getElementById("bolePicksList");
const bolePicksMetaEl = document.getElementById("bolePicksMeta");
const bolePicksWrapEl = document.getElementById("bolePicksWrap");
const boleViewToggleEl = document.getElementById("boleViewToggle");
const boleHotBtnEl = document.getElementById("boleHotBtn");
const boleTimelineBtnEl = document.getElementById("boleTimelineBtn");
const sectionTabsEl = document.getElementById("sectionTabs");
const sectionSummaryEl = document.getElementById("sectionSummary");
const topStoriesTitleEl = document.getElementById("topStoriesTitle");
const topStoriesSubEl = document.getElementById("topStoriesSub");

const SOURCE_KINDS = {
  official_ai: { label: "官方", tone: "official" },
  curated_media: { label: "精选媒体", tone: "aihub" },
  aibreakfast: { label: "日报", tone: "newsletter" },
  followbuilders: { label: "Builders/X", tone: "builders" },
  xapi: { label: "X API", tone: "builders" },
  techurls: { label: "聚合", tone: "aggregate" },
  buzzing: { label: "聚合", tone: "aggregate" },
  iris: { label: "聚合", tone: "aggregate" },
  bestblogs: { label: "博客", tone: "blogs" },
  tophub: { label: "聚合", tone: "aggregate" },
  zeli: { label: "聚合", tone: "aggregate" },
  aihubtoday: { label: "AI站点", tone: "aihub" },
  aibase: { label: "AI站点", tone: "aihub" },
  newsnow: { label: "聚合", tone: "aggregate" },
};

const SECTION_DEFS = [
  { id: "hot", label: "热点", short: "热点", description: "跨来源聚合后的优先阅读列表" },
  { id: "models", label: "模型", short: "模型", description: "模型发布、能力升级、评测与开源权重" },
  { id: "products", label: "产品", short: "产品", description: "AI 应用、Agent、生成工具和用户产品更新" },
  { id: "devtools", label: "开发者", short: "开发者", description: "编程工具、API、开源项目、推理与工程实践" },
  { id: "industry", label: "行业", short: "行业", description: "公司战略、融资收购、监管、芯片与产业变化" },
  { id: "research", label: "研究", short: "研究", description: "论文、基准、方法、数据集与研究团队动态" },
  { id: "china", label: "中文", short: "中文", description: "中文 AI 圈、国内公司、中文媒体和社区信号" },
];

const SECTION_BY_ID = Object.fromEntries(SECTION_DEFS.map((section) => [section.id, section]));

function fmtNumber(n) {
  return new Intl.NumberFormat("zh-CN").format(n || 0);
}

function fmtTime(iso) {
  if (!iso) return "时间未知";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "时间未知";
  return new Intl.DateTimeFormat("zh-CN", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}

function fmtDate(iso) {
  if (!iso) return "未知日期";
  const d = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(d.getTime())) return iso;
  return new Intl.DateTimeFormat("zh-CN", {
    month: "2-digit",
    day: "2-digit",
  }).format(d);
}

function setStats(payload) {
  const cards = [
    ["AI 信号", fmtNumber(payload.total_items)],
    ["站点数", fmtNumber(payload.site_count)],
    ["来源分组", fmtNumber(payload.source_count)],
    ["归档", fmtNumber(payload.archive_total || 0)]
  ];

  statsEl.innerHTML = "";
  cards.forEach(([k, v]) => {
    const node = document.createElement("div");
    node.className = "stat";
    node.innerHTML = `<div class="k">${k}</div><div class="v">${v}</div>`;
    statsEl.appendChild(node);
  });
}

function sourceKind(siteId) {
  return SOURCE_KINDS[siteId] || { label: "来源", tone: "default" };
}

function siteRows() {
  return Array.isArray(state.sourceStatus?.sites) ? state.sourceStatus.sites : [];
}

function siteRow(siteId) {
  return siteRows().find((site) => site.site_id === siteId) || null;
}

function renderCoverageCard(label, value, meta, tone = "") {
  const node = document.createElement("div");
  node.className = `coverage-card ${tone}`.trim();
  const labelEl = document.createElement("span");
  labelEl.className = "coverage-label";
  labelEl.textContent = label;
  const valueEl = document.createElement("strong");
  valueEl.textContent = value;
  const metaEl = document.createElement("span");
  metaEl.className = "coverage-meta";
  metaEl.textContent = meta;
  node.append(labelEl, valueEl, metaEl);
  return node;
}

function renderCoverageStrip(errorMessage = "") {
  if (!coverageStripEl) return;
  coverageStripEl.innerHTML = "";

  const rows = siteRows();
  const failedSites = Array.isArray(state.sourceStatus?.failed_sites) ? state.sourceStatus.failed_sites : [];
  const rss = state.sourceStatus?.rss_opml || {};
  const agentmail = state.sourceStatus?.agentmail || {};
  const xApi = state.sourceStatus?.x_api || {};
  const allCount = Number(state.sourceStatus?.items_before_topic_filter || state.totalAllMode || state.itemsAll.length || 0);
  const coverageCount = Number(state.sourceStatus?.fetched_raw_items || state.totalRaw || allCount || 0);
  const officialCount = Number(siteRow("official_ai")?.item_count || 0);
  const newsletterCount = Number(siteRow("aibreakfast")?.item_count || 0);
  const buildersCount = Number(siteRow("followbuilders")?.item_count || 0);
  const totalSites = rows.length;
  const okSites = Number(state.sourceStatus?.successful_sites || 0);
  const opmlValue = rss.enabled ? `${fmtNumber(rss.ok_feeds || 0)}/${fmtNumber(rss.effective_feed_total || 0)}` : "OPML";
  const opmlMeta = rss.enabled ? "RSS示例/自定义订阅已接入" : "可用OPML批量接入RSS";
  const xApiLabel = xApi.enabled ? `X ${xApi.skipped ? "待窗口" : fmtNumber(xApi.item_count || 0)}` : "X待配置";
  const mailLabel = agentmail.enabled ? `Mail ${fmtNumber(agentmail.item_count || 0)}` : "Mail待配置";
  const advancedMeta = xApi.enabled || agentmail.enabled
    ? `额度保护 · ${xApiLabel} / ${mailLabel}`
    : "X API 与 AgentMail 默认关闭";

  const cards = [
    ["源健康", totalSites ? `${fmtNumber(okSites)}/${fmtNumber(totalSites)}` : "加载中", failedSites.length ? `${fmtNumber(failedSites.length)} 个失败源` : (errorMessage || "内置源正常"), failedSites.length ? "warn" : "ok"],
    ["今日覆盖池", `${fmtNumber(coverageCount)} 条`, allCount ? `全网抓取原始信号 · ${fmtNumber(allCount)} 条入池` : "全网抓取原始信号", "signal"],
    ["AI强相关", `${fmtNumber(state.totalAi)} 条`, "24小时强相关信号", "signal"],
    ["官方/日报源池", `${fmtNumber(officialCount + newsletterCount)} 条`, "官方节点 + AI Breakfast", "official"],
    ["Builders/X源池", `${fmtNumber(buildersCount)} 条`, "Follow Builders公开feed", "builders"],
    ["RSS/OPML扩展", opmlValue, opmlMeta, "private"],
    ["高级源", "X / Mail", advancedMeta, "private"],
  ];

  cards.forEach(([label, value, meta, tone]) => {
    coverageStripEl.appendChild(renderCoverageCard(label, value, meta, tone));
  });
}

function renderAdvancedSummary() {
  if (!advancedSummaryEl) return;
  const status = state.sourceStatus;
  const allCount = state.allDedup
    ? (state.totalAllMode || state.itemsAll.length)
    : (state.totalRaw || state.itemsAllRaw.length);
  if (!status) {
    advancedSummaryEl.textContent = `全量 ${fmtNumber(allCount)} 条`;
    return;
  }
  const sites = Array.isArray(status.sites) ? status.sites : [];
  const totalSites = sites.length;
  const okSites = Number(status.successful_sites || 0);
  advancedSummaryEl.textContent = `${fmtNumber(okSites)}/${fmtNumber(totalSites)} 源可用 · 全量 ${fmtNumber(allCount)} 条`;
}

function computeSiteStats(items) {
  const m = new Map();
  items.forEach((item) => {
    if (!m.has(item.site_id)) {
      m.set(item.site_id, { site_id: item.site_id, site_name: item.site_name, count: 0, raw_count: 0 });
    }
    const row = m.get(item.site_id);
    row.count += 1;
    row.raw_count += 1;
  });
  return Array.from(m.values()).sort((a, b) => b.count - a.count || a.site_name.localeCompare(b.site_name, "zh-CN"));
}

function currentSiteStats() {
  if (state.mode === "ai") return state.statsAi || [];
  return computeSiteStats(state.allDedup ? (state.itemsAll || []) : (state.itemsAllRaw || []));
}

function sectionStats(sectionId) {
  const items = sectionItems(modeItems(), sectionId);
  const highCount = items.filter((item) => scorePercent(item) >= 75 || item.site_id === "official_ai" || item.site_id === "aihot").length;
  const sourceSet = new Set(items.map((item) => item.source || item.site_name || item.site_id).filter(Boolean));
  return { items, count: items.length, highCount, sourceCount: sourceSet.size };
}

function renderSectionTabs() {
  if (!sectionTabsEl) return;
  sectionTabsEl.innerHTML = "";
  SECTION_DEFS.forEach((section) => {
    const stats = sectionStats(section.id);
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = `section-tab ${state.activeSection === section.id ? "active" : ""}`;
    btn.setAttribute("role", "tab");
    btn.setAttribute("aria-selected", state.activeSection === section.id ? "true" : "false");
    btn.dataset.section = section.id;
    btn.innerHTML = `<span>${section.label}</span><strong>${fmtNumber(stats.count)}</strong>`;
    btn.addEventListener("click", () => {
      state.activeSection = section.id;
      state.boleExpanded = false;
      renderSectionTabs();
      renderModeSwitch();
      renderSiteFilters();
      renderBolePicks();
      renderList();
    });
    sectionTabsEl.appendChild(btn);
  });
}

function renderSectionSummary(filteredItems = null) {
  if (!sectionSummaryEl) return;
  const section = SECTION_BY_ID[state.activeSection] || SECTION_BY_ID.hot;
  const items = filteredItems || getFilteredItems();
  const highCount = items.filter((item) => scorePercent(item) >= 75 || item.site_id === "official_ai" || item.site_id === "aihot").length;
  const sources = new Set(items.map((item) => item.source || item.site_name || item.site_id).filter(Boolean));
  const modeText = state.mode === "all" ? (state.allDedup ? "全量去重" : "全量原始") : "AI强相关";
  sectionSummaryEl.textContent = `过去 24 小时 · ${section.label} · ${fmtNumber(items.length)} 条 · ${fmtNumber(highCount)} 条高优先级 · ${fmtNumber(sources.size)} 个来源 · ${modeText}`;
}

function siteRatioText(siteStats) {
  const count = Number(siteStats.count || 0);
  const raw = Number(siteStats.raw_count ?? siteStats.count ?? 0);
  if (!raw) return `${fmtNumber(count)} 条`;
  if (raw === count) return `${fmtNumber(count)} 条`;
  return `${fmtNumber(count)}/${fmtNumber(raw)} · ${Math.round((count / raw) * 100)}%AI`;
}

function renderSiteFilters() {
  const stats = currentSiteStats();

  siteSelectEl.innerHTML = '<option value="">全部站点</option>';
  stats.forEach((s) => {
    const opt = document.createElement("option");
    opt.value = s.site_id;
    opt.textContent = `${s.site_name} (${siteRatioText(s)})`;
    siteSelectEl.appendChild(opt);
  });
  siteSelectEl.value = state.siteFilter;

  sitePillsEl.innerHTML = "";
  const allPill = document.createElement("button");
  allPill.className = `pill ${state.siteFilter === "" ? "active" : ""}`;
  allPill.textContent = "全部";
  allPill.onclick = () => {
    state.siteFilter = "";
    renderSiteFilters();
    renderList();
  };
  sitePillsEl.appendChild(allPill);

  stats.forEach((s) => {
    const btn = document.createElement("button");
    btn.className = `pill ${state.siteFilter === s.site_id ? "active" : ""}`;
    btn.textContent = `${s.site_name} ${siteRatioText(s)}`;
    btn.onclick = () => {
      state.siteFilter = s.site_id;
      renderSiteFilters();
      renderList();
    };
    sitePillsEl.appendChild(btn);
  });
}

function renderModeSwitch() {
  modeAiBtnEl.classList.toggle("active", state.mode === "ai");
  modeAllBtnEl.classList.toggle("active", state.mode === "all");
  if (allDedupeWrapEl) allDedupeWrapEl.classList.toggle("show", state.mode === "all");
  if (allDedupeToggleEl) allDedupeToggleEl.checked = state.allDedup;
  if (allDedupeLabelEl) allDedupeLabelEl.textContent = state.allDedup ? "去重开" : "去重关";
  if (state.mode === "ai") {
    modeHintEl.textContent = `AI强相关 · ${fmtNumber(state.totalAi)} 条`;
  } else {
    const allCount = state.allDedup
      ? (state.totalAllMode || state.itemsAll.length)
      : (state.totalRaw || state.itemsAllRaw.length);
    modeHintEl.textContent = `全量 · ${state.allDedup ? "去重开" : "去重关"} · ${fmtNumber(allCount)} 条`;
  }
  if (listTitleEl) {
    const section = SECTION_BY_ID[state.activeSection] || SECTION_BY_ID.hot;
    listTitleEl.textContent = state.activeSection === "hot" ? "热点情报流" : `${section.label}情报流`;
  }
  renderAdvancedSummary();
  renderSectionSummary();
}

function effectiveAllItems() {
  return state.allDedup ? state.itemsAll : state.itemsAllRaw;
}

function modeItems() {
  return state.mode === "all" ? effectiveAllItems() : state.itemsAi;
}

function sectionItems(items = modeItems(), sectionId = state.activeSection) {
  const source = Array.isArray(items) ? items : [];
  if (sectionId === "hot") {
    return [...source].sort((a, b) => itemPriorityScore(b) - itemPriorityScore(a) || timelineMs(b) - timelineMs(a));
  }
  return source.filter((item) => itemMatchesSection(item, sectionId));
}

function getFilteredItems() {
  const q = state.query.trim().toLowerCase();
  return sectionItems().filter((item) => {
    if (state.siteFilter && item.site_id !== state.siteFilter) return false;
    if (!q) return true;
    const hay = `${item.title || ""} ${item.title_zh || ""} ${item.title_en || ""} ${item.site_name || ""} ${item.source || ""}`.toLowerCase();
    return hay.includes(q);
  });
}

function itemTitleText(item) {
  return (item.title_zh || item.title || item.title_en || "未命名更新").trim();
}

function scorePercent(item) {
  const score = Number(item.ai_score ?? item.score ?? 0);
  if (!Number.isFinite(score) || score <= 0) return 0;
  return Math.round(score <= 1 ? score * 100 : score);
}

function scoreTone(score) {
  if (score >= 90) return "hot";
  if (score >= 75) return "strong";
  return "watch";
}

function itemPriorityScore(item) {
  const score = scorePercent(item);
  const officialBonus = item.site_id === "official_ai" ? 18 : 0;
  const selectedBonus = item.site_id === "aihot" ? 16 : 0;
  const sourceTierBonus = Math.max(0, 8 - Number(item.source_tier_rank || 8));
  const signalBonus = Array.isArray(item.ai_signals) ? Math.min(10, item.ai_signals.length * 2) : 0;
  const ageMs = Date.now() - timelineMs(item);
  const ageHours = Number.isFinite(ageMs) && ageMs > 0 ? ageMs / 3600000 : 24;
  const recencyBonus = Math.max(0, 12 - ageHours / 2);
  return score + officialBonus + selectedBonus + sourceTierBonus + signalBonus + recencyBonus;
}

function labelText(item) {
  const labels = {
    ai_general: "AI信号",
    model_release: "模型发布",
    agent_workflow: "Agent工作流",
    ai_product_update: "产品更新",
    developer_tooling: "开发工具",
    developer_tool: "开发工具",
    infrastructure: "基础设施",
    infra_compute: "基础设施",
    industry_business: "行业动态",
    research_paper: "研究论文",
    robotics: "机器人",
    curated_hotlist: "热点",
    ai_tech: "技术趋势",
  };
  return labels[item.ai_label] || item.ai_label || "精选信号";
}

function itemHaystack(item) {
  return [
    item.title,
    item.title_zh,
    item.title_en,
    item.title_original,
    item.source,
    item.site_name,
    item.site_id,
    item.ai_label,
    ...(Array.isArray(item.ai_signals) ? item.ai_signals : []),
  ].filter(Boolean).join(" ").toLowerCase();
}

function matchesAny(text, patterns) {
  return patterns.some((pattern) => pattern.test(text));
}

function itemSections(item) {
  const hay = itemHaystack(item);
  const contentHay = [
    item.title,
    item.title_zh,
    item.title_en,
    item.title_original,
    item.source,
    item.site_name,
    item.site_id,
    ...(Array.isArray(item.ai_signals) ? item.ai_signals : []),
  ].filter(Boolean).join(" ").toLowerCase();
  const sections = new Set();
  const label = item.ai_label || "";
  const source = `${item.source || ""} ${item.site_name || ""}`.toLowerCase();
  const hasExplicitModelTerm = matchesAny(contentHay, [
    /gpt[-\s]?\d|claude|gemini|grok|llama|qwen|deepseek|mistral|kimi\s?k\d|glm|gemma|模型|model|weights|权重|多模态|视频生成|diffusion|sora|seedance|llm|大模型/,
  ]);
  const looksLikeToolOrProduct = matchesAny(hay, [
    /skill|copilot|codex|cli|api|sdk|dashboard|workflow|tool|工具|助手|应用|插件|工作流|支付宝|浏览器|搜索/,
  ]);

  if (
    hasExplicitModelTerm ||
    (label === "model_release" && !looksLikeToolOrProduct)
  ) sections.add("models");

  if (
    label === "ai_product_update" ||
    label === "agent_workflow" ||
    label === "robotics" ||
    matchesAny(hay, [
      /app|product|agent|workflow|siri|copilot|chatgpt|perplexity|runway|suno|支付宝|产品|应用|智能体|机器人|浏览器|搜索|助手|生成工具|办公|教育/,
    ])
  ) sections.add("products");

  if (
    label === "developer_tool" ||
    label === "developer_tooling" ||
    label === "infra_compute" ||
    matchesAny(hay, [
      /github|cursor|codex|copilot|openrouter|api|sdk|mcp|cli|framework|inference|推理|开发者|开源|代码|编程|算力|芯片|nvidia|cloud|部署|benchmarking|token/,
    ])
  ) sections.add("devtools");

  if (
    label === "industry_business" ||
    matchesAny(hay, [
      /funding|raised|ipo|acquire|acquisition|lawsuit|regulation|policy|white house|pentagon|nvidia|salesforce|meta|microsoft|融资|收购|上市|监管|政策|裁员|估值|债券|芯片|公司|行业|政府|五角大楼|白宫/,
    ])
  ) sections.add("industry");

  if (
    label === "research_paper" ||
    matchesAny(hay, [
      /paper|arxiv|research|benchmark|eval|dataset|lmsys|rdi|berkeley|huggingface daily papers|论文|研究|基准|评测|数据集|训练|k-means|speculative decoding/,
    ])
  ) sections.add("research");

  if (
    source.includes("it之家") ||
    source.includes("36氪") ||
    source.includes("掘金") ||
    source.includes("readhub") ||
    source.includes("aibase") ||
    source.includes("公众号") ||
    source.includes("宝玉") ||
    source.includes("小互") ||
    source.includes("ayi") ||
    matchesAny(hay, [
      /阿里|通义|千问|智谱|kimi|月之暗面|minimax|字节|火山|百度|腾讯|华为|蚂蚁|讯飞|国内|中文|开源中国|少数派|虎嗅/,
    ])
  ) sections.add("china");

  if (!sections.size) sections.add("industry");
  return sections;
}

function itemMatchesSection(item, sectionId) {
  return sectionId === "hot" || itemSections(item).has(sectionId);
}

function sectionBadgeLabel(sectionId) {
  return SECTION_BY_ID[sectionId]?.short || "栏目";
}

function reasonText(item) {
  const signals = Array.isArray(item.ai_signals) ? item.ai_signals.filter(Boolean).slice(0, 3) : [];
  if (signals.length) return `命中：${signals.join(" / ")}`;
  if (item.ai_relevance_reason) return String(item.ai_relevance_reason).replaceAll("_", " ");
  return "来源与标题信号通过筛选";
}

function timelineIso(item) {
  const published = item.published_at || "";
  const seen = item.first_seen_at || "";
  const generated = state.generatedAt || "";
  if (published && generated) {
    const publishedMs = new Date(published).getTime();
    const generatedMs = new Date(generated).getTime();
    if (Number.isFinite(publishedMs) && Number.isFinite(generatedMs) && publishedMs > generatedMs + 10 * 60 * 1000) {
      return seen || published;
    }
  }
  return published || seen;
}

function timelineMs(item) {
  const d = new Date(timelineIso(item));
  return Number.isNaN(d.getTime()) ? 0 : d.getTime();
}

function normalizedEventText(text) {
  return String(text || "")
    .toLowerCase()
    .replace(/https?:\/\/\S+/g, "")
    .replace(/[\s\u3000]+/g, "")
    .replace(/[，。、“”‘’：:；;！!？?（）()\[\]【】《》<>·.,/\\|_-]/g, "");
}

function eventKey(item) {
  const raw = itemTitleText(item);
  const bracket = raw.match(/《([^》]{4,40})》/);
  if (bracket) return `book:${normalizedEventText(bracket[1]).slice(0, 36)}`;

  const normalized = normalizedEventText(raw);
  const model = normalized.match(/(bitcpmcann|deepseekv\d+(?:pro)?|grokv\d+(?:medium)?|gemini\d+(?:\.\d+)?(?:flash|pro)?|gpt\d+(?:\.\d+)?|llama\d+)/);
  if (model) return `entity:${model[1]}`;

  return `title:${normalized.slice(0, 34)}`;
}

function sourceSignal(item) {
  const site = item.site_name || "";
  const source = item.source || "";
  const hay = `${site} ${source}`.toLowerCase();
  if (site === "AI HOT") return "AI HOT精选";
  if (hay.includes("hackernews") || hay.includes("hacker news")) return "HN热议";
  if (source.includes("GitHub · Trending Today") || hay.includes("github")) return "GitHub趋势";
  if (site === "Official AI Updates") return "官方更新";
  if (site === "Follow Builders") return "Builders";
  if (site === "AIbase") return "AIbase";
  if (site === "OPML RSS") return "OPML";
  return site || "来源";
}

function sourcePriority(item) {
  const signal = sourceSignal(item);
  if (signal === "官方更新") return 100;
  if (signal === "AI HOT精选") return 90;
  if (signal === "AIbase") return 82;
  if (signal === "Builders") return 74;
  if (signal === "OPML") return 68;
  if (signal === "HN热议" || signal === "GitHub趋势") return 62;
  return 50;
}

function clusterBoleEvents(rows) {
  const clusters = new Map();
  rows.forEach((row) => {
    const key = eventKey(row.item);
    if (!clusters.has(key)) clusters.set(key, { key, rows: [], signals: new Set(), score: 0, primary: row });
    const cluster = clusters.get(key);
    cluster.rows.push(row);
    cluster.signals.add(sourceSignal(row.item));
    const currentPrimary = cluster.primary;
    const betterPrimary = sourcePriority(row.item) - sourcePriority(currentPrimary.item)
      || row.score - currentPrimary.score
      || timelineMs(row.item) - timelineMs(currentPrimary.item);
    if (betterPrimary > 0) cluster.primary = row;
  });
  return Array.from(clusters.values()).map((cluster) => {
    const signals = Array.from(cluster.signals);
    const maxScore = Math.max(...cluster.rows.map((row) => row.score));
    const sourceBonus = Math.min(12, Math.max(0, signals.length - 1) * 6);
    const candidateBonus = signals.some((s) => s === "AI HOT精选") ? 8
      : signals.some((s) => s === "HN热议" || s === "GitHub趋势") ? 6
      : signals.some((s) => s === "官方更新") ? 5
      : 0;
    return {
      item: cluster.primary.item,
      index: cluster.primary.index,
      rows: cluster.rows,
      sourceSignals: signals,
      sourceCount: signals.length,
      mergedCount: cluster.rows.length,
      score: Math.min(100, Math.round(maxScore + sourceBonus + candidateBonus)),
    };
  });
}

function storyTimeMs(story, key) {
  const iso = story && story[key];
  if (!iso) return 0;
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? 0 : d.getTime();
}

function storyScore(story) {
  const raw = (story && (story.importance_score ?? story.score ?? story.importance)) || 0;
  const score = Number(raw);
  if (!Number.isFinite(score) || score <= 0) return 0;
  return Math.round(score <= 1 ? score * 100 : score);
}

function storyImportanceTone(label) {
  if (!label) return "watch";
  if (label.includes("重大")) return "hot";
  if (label.includes("官方")) return "official";
  if (label.includes("多源")) return "strong";
  if (label.includes("行业")) return "watch";
  return "watch";
}

function storyPrimaryTitleText(story) {
  const primary = (story && story.primary_item) || {};
  const bilingual = String(primary.title || (story && story.title) || "").trim();
  if (bilingual.includes(" / ")) {
    const [zh, en] = bilingual.split(" / ");
    return (zh || en || bilingual).trim();
  }
  return bilingual || "未命名更新";
}

function storyPrimaryEnText(story) {
  const primary = (story && story.primary_item) || {};
  const bilingual = String(primary.title || (story && story.title) || "").trim();
  if (bilingual.includes(" / ")) {
    const [, en] = bilingual.split(" / ");
    return (en || "").trim();
  }
  return "";
}

function storySourceCount(story) {
  const sources = Array.isArray(story && story.sources) ? story.sources : [];
  const explicit = Number(story && story.duplicate_count);
  if (Number.isFinite(explicit) && explicit > 0) return explicit;
  return Math.max(1, sources.length);
}

function formatStoryTime(story) {
  const earliest = story.earliest_at;
  const latest = story.latest_at;
  if (latest && earliest && latest !== earliest) {
    return { latest, earliest };
  }
  return { latest: latest || earliest, earliest: null };
}

function pickBoleItems(items) {
  const ranked = [...items]
    .map((item, index) => ({ item, index, score: scorePercent(item) }))
    .filter((row) => row.score > 0)
    .sort((a, b) => {
      const byScore = b.score - a.score;
      if (byScore !== 0) return byScore;
      return timelineMs(b.item) - timelineMs(a.item) || a.index - b.index;
    });

  const sorted = clusterBoleEvents(ranked).sort((a, b) => {
    const byMultiSource = b.sourceCount - a.sourceCount;
    const byScore = b.score - a.score;
    return byMultiSource || byScore || timelineMs(b.item) - timelineMs(a.item) || a.index - b.index;
  });

  const picked = [];
  const addPick = (cluster) => {
    if (cluster && !picked.includes(cluster) && picked.length < 8) picked.push(cluster);
  };
  ["AI HOT精选", "HN热议", "GitHub趋势"].forEach((signal) => {
    addPick(sorted.find((cluster) => cluster.sourceSignals.includes(signal)));
  });
  sorted.forEach(addPick);
  return picked;
}

function boleReasonText(row) {
  const signals = row.sourceSignals || [];
  const sourceText = signals.length ? `来源命中：${signals.join(" / ")}` : "来源命中：单源";
  const mergeText = row.mergedCount > 1 ? `合并${row.mergedCount}条同事件` : "单条事件";
  return `${sourceText} · ${mergeText} · ${reasonText(row.item)}`;
}

function buildBoleLead(row) {
  const { item, score } = row;
  const lead = document.createElement("a");
  lead.className = "bole-lead-card";
  lead.href = item.url || "#";
  lead.target = "_blank";
  lead.rel = "noopener noreferrer";

  const top = document.createElement("div");
  top.className = "bole-lead-top";
  const kicker = document.createElement("span");
  kicker.className = "bole-kicker";
  kicker.textContent = `${labelText(item)} · ${fmtTime(timelineIso(item))}`;
  const scoreEl = document.createElement("strong");
  scoreEl.className = `bole-score-orb ${scoreTone(score)}`;
  scoreEl.innerHTML = `<span>${score}</span><small>分</small>`;
  top.append(kicker, scoreEl);

  const title = document.createElement("div");
  title.className = "bole-lead-title";
  title.textContent = itemTitleText(item);

  const reason = document.createElement("div");
  reason.className = "bole-lead-reason";
  reason.textContent = reasonText(item);

  const foot = document.createElement("div");
  foot.className = "bole-lead-foot";
  foot.innerHTML = `<span>${item.site_name || "来源"}</span><span>${item.source || "未分区"}</span>`;

  lead.append(top, title, reason, foot);
  return lead;
}

function buildBoleTimelineRow(row, rank) {
  const { item, score } = row;
  const link = document.createElement("a");
  link.className = "bole-row";
  link.href = item.url || "#";
  link.target = "_blank";
  link.rel = "noopener noreferrer";

  const time = document.createElement("time");
  time.className = "bole-row-time";
  time.textContent = fmtTime(timelineIso(item));

  const body = document.createElement("div");
  body.className = "bole-row-body";
  const meta = document.createElement("div");
  meta.className = "bole-row-meta";
  meta.innerHTML = `<span>#${rank}</span><span>${item.site_name || "来源"}</span><strong>${score}分</strong>`;
  (row.sourceSignals || []).slice(0, 4).forEach((signal) => {
    const tag = document.createElement("span");
    tag.className = "source-hit";
    tag.textContent = signal;
    meta.appendChild(tag);
  });
  const title = document.createElement("div");
  title.className = "bole-row-title";
  title.textContent = itemTitleText(item);
  const reason = document.createElement("div");
  reason.className = "bole-row-reason";
  reason.textContent = boleReasonText(row);
  body.append(meta, title, reason);

  link.append(time, body);
  return link;
}

function buildStoryCard(story, rank) {
  const link = document.createElement("a");
  link.className = "story-row";
  const primary = story.primary_item || {};
  link.href = primary.url || story.primary_url || story.url || "#";
  link.target = "_blank";
  link.rel = "noopener noreferrer";

  const time = document.createElement("div");
  time.className = "story-time";
  const { latest, earliest } = formatStoryTime(story);
  const latestEl = document.createElement("span");
  latestEl.className = "story-time-latest";
  latestEl.textContent = fmtTime(latest);
  time.appendChild(latestEl);
  if (earliest) {
    const rangeEl = document.createElement("span");
    rangeEl.className = "story-time-range";
    rangeEl.textContent = `起 ${fmtTime(earliest)}`;
    time.appendChild(rangeEl);
  }
  const rankEl = document.createElement("span");
  rankEl.className = "story-rank";
  rankEl.textContent = `#${rank}`;
  time.appendChild(rankEl);

  const body = document.createElement("div");
  body.className = "story-body";

  const meta = document.createElement("div");
  meta.className = "story-meta";
  if (story.importance_label) {
    const imp = document.createElement("span");
    imp.className = `story-importance ${storyImportanceTone(story.importance_label)}`;
    imp.textContent = story.importance_label;
    meta.appendChild(imp);
  }
  const sourceCount = storySourceCount(story);
  const countEl = document.createElement("span");
  countEl.className = "story-count";
  countEl.textContent = `${sourceCount} 个来源`;
  meta.appendChild(countEl);
  const score = storyScore(story);
  if (score > 0) {
    const scoreEl = document.createElement("strong");
    scoreEl.className = "story-score";
    scoreEl.innerHTML = `<span>${score}</span><small>分</small>`;
    meta.appendChild(scoreEl);
  }
  body.appendChild(meta);

  const sources = Array.isArray(story.sources) ? story.sources : [];
  if (sources.length) {
    const sourcesEl = document.createElement("div");
    sourcesEl.className = "story-sources";
    sources.slice(0, 6).forEach((src) => {
      const tag = document.createElement("span");
      const kind = sourceKind(src.site_id);
      tag.className = `story-source-chip kind-${kind.tone}`;
      tag.textContent = src.site_name || src.source || "来源";
      sourcesEl.appendChild(tag);
    });
    if (sources.length > 6) {
      const more = document.createElement("span");
      more.className = "story-source-more";
      more.textContent = `+${sources.length - 6}`;
      sourcesEl.appendChild(more);
    }
    body.appendChild(sourcesEl);
  }

  const title = document.createElement("div");
  title.className = "story-title";
  const primaryTitle = storyPrimaryTitleText(story);
  const enTitle = storyPrimaryEnText(story);
  if (enTitle && enTitle !== primaryTitle) {
    const zh = document.createElement("span");
    zh.className = "story-title-zh";
    zh.textContent = primaryTitle;
    const sub = document.createElement("span");
    sub.className = "story-title-en";
    sub.textContent = enTitle;
    title.append(zh, sub);
  } else {
    title.textContent = primaryTitle;
  }
  body.appendChild(title);

  link.append(time, body);
  return link;
}

const HOT_DECAY_HOURS = 12;

function storyHotness(story) {
  const sources = Number(story.source_count) || 1;
  if (sources < 2) return 0;
  const latest = storyTimeMs(story, "latest_at") || storyTimeMs(story, "earliest_at");
  const ageHours = latest ? Math.max(0, (Date.now() - latest) / 3600000) : 24;
  return (sources - 1) * Math.exp(-ageHours / HOT_DECAY_HOURS);
}

function hotStories(stories) {
  return stories
    .filter((story) => storyHotness(story) > 0)
    .sort((a, b) => storyHotness(b) - storyHotness(a) || storyScore(b) - storyScore(a));
}

function renderBoleBrief(stories) {
  bolePicksListEl.innerHTML = "";
  bolePicksListEl.className = "bole-board";

  const hot = hotStories(stories);
  const hotAvailable = hot.length >= 2;
  // 宁缺毋滥: the hot view only exists when there is real multi-source heat.
  if (boleViewToggleEl) boleViewToggleEl.hidden = !hotAvailable;
  if (!hotAvailable) state.boleView = "timeline";
  if (boleHotBtnEl) boleHotBtnEl.classList.toggle("active", state.boleView === "hot");
  if (boleTimelineBtnEl) boleTimelineBtnEl.classList.toggle("active", state.boleView !== "hot");

  let sorted;
  let metaLabel;
  if (state.boleView === "hot") {
    sorted = hot;
    metaLabel = `当前热点 · ${fmtNumber(sorted.length)} 簇 · 多源×时间衰减`;
  } else {
    sorted = [...stories].sort((a, b) => {
      const aLatest = storyTimeMs(a, "latest_at") || storyTimeMs(a, "earliest_at");
      const bLatest = storyTimeMs(b, "latest_at") || storyTimeMs(b, "earliest_at");
      if (aLatest !== bLatest) return bLatest - aLatest;
      return storyScore(b) - storyScore(a);
    });
    const topScore = Math.max(...sorted.map((s) => storyScore(s)));
    metaLabel = topScore > 0
      ? `故事时间线 · ${fmtNumber(sorted.length)} 条 · 最高 ${topScore} 分`
      : `故事时间线 · ${fmtNumber(sorted.length)} 条`;
  }

  const list = document.createElement("div");
  list.className = "bole-compact-list bole-timeline";
  const defaultLimit = state.boleView === "hot" ? BOLE_HOT_LIMIT : BOLE_TIMELINE_LIMIT;
  const visibleStories = state.boleExpanded ? sorted : sorted.slice(0, defaultLimit);
  visibleStories.forEach((story, index) => {
    list.appendChild(buildStoryCard(story, index + 1));
  });
  bolePicksListEl.appendChild(list);

  if (sorted.length > defaultLimit) {
    const moreBtn = document.createElement("button");
    moreBtn.type = "button";
    moreBtn.className = "bole-more-btn";
    moreBtn.textContent = state.boleExpanded
      ? "收起"
      : (state.boleView === "hot" ? "展开全部热点" : "展开完整时间线");
    moreBtn.addEventListener("click", () => {
      state.boleExpanded = !state.boleExpanded;
      renderBolePicks();
    });
    bolePicksListEl.appendChild(moreBtn);
  }

  const generatedAt = state.dailyBrief && state.dailyBrief.generated_at;
  bolePicksMetaEl.textContent = generatedAt ? `${metaLabel} · ${fmtTime(generatedAt)}` : metaLabel;
  document.dispatchEvent(new CustomEvent("aiRadar:briefRendered"));
}

function renderBoleFallback(picks) {
  bolePicksListEl.innerHTML = "";
  bolePicksListEl.className = "bole-board";

  const note = document.createElement("div");
  note.className = "bole-fallback-note";
  note.textContent = "故事合并数据暂未生成，先展示伯乐候选信号。";
  bolePicksListEl.appendChild(note);

  if (!picks.length) {
    const empty = document.createElement("div");
    empty.className = "bole-empty";
    empty.textContent = "当前数据里没有可展示的评分字段。";
    bolePicksListEl.appendChild(empty);
    return;
  }

  const timelinePicks = [...picks].sort((a, b) => {
    const byTime = timelineMs(b.item) - timelineMs(a.item);
    if (byTime !== 0) return byTime;
    return b.score - a.score || a.index - b.index;
  });
  const list = document.createElement("div");
  list.className = "bole-compact-list";
  const visiblePicks = state.boleExpanded ? timelinePicks : timelinePicks.slice(0, BOLE_TIMELINE_LIMIT);
  visiblePicks.forEach((row, index) => {
    list.appendChild(buildBoleTimelineRow(row, index + 1));
  });
  bolePicksListEl.appendChild(list);
  if (timelinePicks.length > BOLE_TIMELINE_LIMIT) {
    const moreBtn = document.createElement("button");
    moreBtn.type = "button";
    moreBtn.className = "bole-more-btn";
    moreBtn.textContent = state.boleExpanded ? "收起" : "展开完整时间线";
    moreBtn.addEventListener("click", () => {
      state.boleExpanded = !state.boleExpanded;
      renderBolePicks();
    });
    bolePicksListEl.appendChild(moreBtn);
  }
  document.dispatchEvent(new CustomEvent("aiRadar:briefRendered"));
}

function renderBolePicks() {
  if (!bolePicksListEl || !bolePicksMetaEl) return;
  bolePicksListEl.innerHTML = "";
  bolePicksListEl.className = "top-stories-grid";
  if (boleViewToggleEl) boleViewToggleEl.hidden = true;
  if (bolePicksWrapEl) bolePicksWrapEl.hidden = false;

  const section = SECTION_BY_ID[state.activeSection] || SECTION_BY_ID.hot;
  const filtered = getFilteredItems();
  const clusters = rankedClustersForItems(filtered);
  const top = clusters.slice(0, 3);
  if (topStoriesTitleEl) topStoriesTitleEl.textContent = state.activeSection === "hot" ? "今日 Top 3" : `${section.label} Top 3`;
  if (topStoriesSubEl) topStoriesSubEl.textContent = `${section.description}；优先多信源、官方/精选、高分和新近信号。`;
  bolePicksMetaEl.textContent = `${fmtNumber(filtered.length)} 条候选 · ${fmtNumber(top.length)} 条优先阅读`;

  if (!top.length) {
    const empty = document.createElement("div");
    empty.className = "bole-empty";
    empty.textContent = "当前栏目和筛选条件下没有可展示的 Top 3。";
    bolePicksListEl.appendChild(empty);
    document.dispatchEvent(new CustomEvent("aiRadar:briefRendered"));
    return;
  }

  top.forEach((row, index) => {
    bolePicksListEl.appendChild(buildTopStoryCard(row, index + 1));
  });
  document.dispatchEvent(new CustomEvent("aiRadar:briefRendered"));
}

function rankedClustersForItems(items) {
  const rows = [...items]
    .map((item, index) => ({ item, index, score: scorePercent(item) || Math.round(itemPriorityScore(item)) }))
    .filter((row) => row.item && (row.score > 0 || row.item.title))
    .sort((a, b) => itemPriorityScore(b.item) - itemPriorityScore(a.item) || timelineMs(b.item) - timelineMs(a.item));

  return clusterBoleEvents(rows).sort((a, b) => {
    const aPriority = itemPriorityScore(a.item) + Math.min(18, (a.sourceCount - 1) * 9);
    const bPriority = itemPriorityScore(b.item) + Math.min(18, (b.sourceCount - 1) * 9);
    return bPriority - aPriority || b.score - a.score || timelineMs(b.item) - timelineMs(a.item);
  });
}

function itemTagLabels(item, row = null) {
  const tags = [];
  const sections = itemSections(item);
  if (state.activeSection !== "hot") tags.push(sectionBadgeLabel(state.activeSection));
  if (row && (row.sourceCount > 1 || row.mergedCount > 1)) tags.push("多源");
  if (item.site_id === "official_ai") tags.push("官方");
  if (item.site_id === "aihot") tags.push("精选");
  if (sections.has("models")) tags.push("模型发布");
  if (sections.has("devtools")) tags.push("开发者");
  if (sections.has("research")) tags.push("研究");
  if (sections.has("china")) tags.push("中文");
  return Array.from(new Set(tags)).slice(0, 5);
}

function itemSourceNames(item, row = null) {
  if (row && Array.isArray(row.rows) && row.rows.length) {
    return Array.from(new Set(row.rows.map((entry) => {
      const sourceItem = entry.item || {};
      return sourceItem.source || sourceItem.site_name || "来源";
    }).filter(Boolean)));
  }
  return [item.source || item.site_name || "来源"];
}

function buildTopStoryCard(row, rank) {
  const item = row.item;
  const link = document.createElement("a");
  link.className = "top-story-card";
  link.href = item.url || "#";
  link.target = "_blank";
  link.rel = "noopener noreferrer";

  const rankEl = document.createElement("span");
  rankEl.className = "top-rank";
  rankEl.textContent = `#${rank}`;

  const meta = document.createElement("div");
  meta.className = "intel-meta";
  const time = document.createElement("time");
  time.textContent = fmtTime(timelineIso(item));
  const source = document.createElement("span");
  source.textContent = item.site_name || "来源";
  const score = document.createElement("strong");
  score.textContent = `${Math.max(scorePercent(item), row.score || 0)}分`;
  meta.append(time, source, score);

  const title = document.createElement("div");
  title.className = "top-story-title";
  title.textContent = itemTitleText(item);

  const reason = document.createElement("div");
  reason.className = "top-story-reason";
  reason.textContent = row.mergedCount > 1 ? boleReasonText(row) : reasonText(item);

  const tags = document.createElement("div");
  tags.className = "intel-tags";
  itemTagLabels(item, row).forEach((label) => {
    const tag = document.createElement("span");
    tag.textContent = label;
    tags.appendChild(tag);
  });

  const sources = document.createElement("div");
  sources.className = "intel-sources";
  const names = itemSourceNames(item, row);
  sources.textContent = `${fmtNumber(names.length)} 个来源 · ${names.slice(0, 4).join(" / ")}${names.length > 4 ? ` / +${names.length - 4}` : ""}`;

  link.append(rankEl, meta, title, reason, tags, sources);
  return link;
}

function buildIntelCard(item, rank) {
  const card = document.createElement("article");
  card.className = "intel-card";

  const meta = document.createElement("div");
  meta.className = "intel-card-meta";
  const rankEl = document.createElement("span");
  rankEl.className = "intel-card-rank";
  rankEl.textContent = `#${rank}`;
  const time = document.createElement("time");
  time.textContent = fmtTime(timelineIso(item));
  const score = scorePercent(item);
  const scoreEl = document.createElement("strong");
  scoreEl.className = `intel-score ${scoreTone(score)}`;
  scoreEl.textContent = score ? `${score}分` : "观察";
  meta.append(rankEl, time, scoreEl);

  const title = document.createElement("a");
  title.className = "intel-title";
  title.href = item.url || "#";
  title.target = "_blank";
  title.rel = "noopener noreferrer";
  title.textContent = itemTitleText(item);

  const reason = document.createElement("p");
  reason.className = "intel-reason";
  reason.textContent = reasonText(item);

  const tags = document.createElement("div");
  tags.className = "intel-tags";
  itemTagLabels(item).forEach((label) => {
    const tag = document.createElement("span");
    tag.textContent = label;
    tags.appendChild(tag);
  });

  const sources = document.createElement("div");
  sources.className = "intel-card-sources";
  const site = document.createElement("span");
  site.textContent = item.site_name || "来源";
  const source = document.createElement("span");
  source.textContent = item.source || "未分区";
  const count = document.createElement("strong");
  count.textContent = "1 个来源";
  sources.append(count, site, source);

  card.append(meta, title, reason, tags, sources);
  return card;
}

function renderItemNode(item) {
  const node = itemTpl.content.firstElementChild.cloneNode(true);
  node.querySelector(".site").textContent = item.site_name;
  const kind = sourceKind(item.site_id);
  const categoryEl = node.querySelector(".category");
  categoryEl.textContent = kind.label;
  categoryEl.classList.add(`kind-${kind.tone}`);
  const score = scorePercent(item);
  const tagEl = document.createElement("span");
  tagEl.className = `ai-tag ${scoreTone(score)}`;
  tagEl.textContent = `${labelText(item)} · ${score || "?"}分`;
  categoryEl.insertAdjacentElement("afterend", tagEl);
  node.querySelector(".source").textContent = `分区: ${item.source}`;
  node.querySelector(".time").textContent = fmtTime(item.published_at || item.first_seen_at);

  const titleEl = node.querySelector(".title");
  const zh = (item.title_zh || "").trim();
  const en = (item.title_en || "").trim();
  titleEl.textContent = "";
  if (zh && en && zh !== en) {
    const primary = document.createElement("span");
    primary.textContent = zh;
    const sub = document.createElement("span");
    sub.className = "title-sub";
    sub.textContent = en;
    titleEl.appendChild(primary);
    titleEl.appendChild(sub);
  } else {
    titleEl.textContent = item.title || zh || en;
  }
  titleEl.href = item.url;
  return node;
}

const SOURCE_ITEM_INITIAL_LIMIT = 8;
const SOURCE_ITEM_LOAD_STEP = 10;
const SITE_GROUP_INITIAL_LIMIT = 4;
const SITE_GROUP_LOAD_STEP = 4;
const SITE_SOURCE_GROUP_INITIAL_LIMIT = 4;
const SITE_SOURCE_GROUP_LOAD_STEP = 4;
const SOURCE_GROUP_INITIAL_LIMIT = 8;
const SOURCE_GROUP_LOAD_STEP = 8;
const BOLE_HOT_LIMIT = 5;
const BOLE_TIMELINE_LIMIT = 8;

function buildSourceGroupNode(source, items) {
  const section = document.createElement("section");
  section.className = "source-group";
  const header = document.createElement("header");
  header.className = "source-group-head";
  const title = document.createElement("h3");
  title.textContent = source;
  const count = document.createElement("span");
  count.textContent = `${fmtNumber(items.length)} 条`;
  const listEl = document.createElement("div");
  listEl.className = "source-group-list";
  header.append(title, count);
  section.append(header, listEl);

  let rendered = 0;
  const appendNextItems = () => {
    const nextCount = rendered ? SOURCE_ITEM_LOAD_STEP : SOURCE_ITEM_INITIAL_LIMIT;
    const next = items.slice(rendered, rendered + nextCount);
    next.forEach((item) => listEl.appendChild(renderItemNode(item)));
    rendered += next.length;
  };

  appendNextItems();

  if (rendered < items.length) {
    const moreBtn = document.createElement("button");
    moreBtn.type = "button";
    moreBtn.className = "group-more-btn";
    const updateLabel = () => {
      const nextCount = Math.min(SOURCE_ITEM_LOAD_STEP, items.length - rendered);
      moreBtn.textContent = `再加载 ${fmtNumber(nextCount)} 条`;
    };
    updateLabel();
    moreBtn.addEventListener("click", () => {
      appendNextItems();
      if (rendered >= items.length) {
        moreBtn.remove();
      } else {
        updateLabel();
      }
    });
    section.append(moreBtn);
  }
  return section;
}

function groupBySource(items) {
  const groupMap = new Map();
  items.forEach((item) => {
    const key = item.source || "未分区";
    if (!groupMap.has(key)) {
      groupMap.set(key, []);
    }
    groupMap.get(key).push(item);
  });

  return Array.from(groupMap.entries()).sort((a, b) => b[1].length - a[1].length || a[0].localeCompare(b[0], "zh-CN"));
}

// Mobile-safe async rendering: avoid blocking the main thread on large lists.
// We chunk site-groups and yield between each chunk so the browser can paint
// and respond to touch events while the list is being built.
let _renderListToken = 0;

function buildSiteGroupNode(site) {
  const siteSection = document.createElement("section");
  siteSection.className = "site-group";
  const header = document.createElement("header");
  header.className = "site-group-head";
  const title = document.createElement("h3");
  title.textContent = site.siteName;
  const count = document.createElement("span");
  count.textContent = `${fmtNumber(site.items.length)} 条`;
  const siteListEl = document.createElement("div");
  siteListEl.className = "site-group-list";
  header.append(title, count);
  siteSection.append(header, siteListEl);

  const sourceGroups = groupBySource(site.items);
  let sourceIdx = 0;
  let moreBtn = null;
  const appendNextSourceGroups = (count = SITE_SOURCE_GROUP_INITIAL_LIMIT) => {
    const frag = document.createDocumentFragment();
    sourceGroups.slice(sourceIdx, sourceIdx + count).forEach(([source, groupItems]) => {
      frag.appendChild(buildSourceGroupNode(source, groupItems));
    });
    sourceIdx += count;
    if (moreBtn) moreBtn.remove();
    siteListEl.appendChild(frag);
    if (sourceIdx < sourceGroups.length) {
      const nextCount = Math.min(SITE_SOURCE_GROUP_LOAD_STEP, sourceGroups.length - sourceIdx);
      moreBtn = addLoadMoreButton(siteSection, `加载更多分区（${fmtNumber(nextCount)} 个）`, () => {
        appendNextSourceGroups(SITE_SOURCE_GROUP_LOAD_STEP);
      });
    }
  };
  appendNextSourceGroups();
  return siteSection;
}

function renderLoadingNotice(label, count) {
  const loading = document.createElement("div");
  loading.className = "list-loading";
  loading.textContent = `正在整理 ${label} · ${fmtNumber(count)} 条`;
  newsListEl.appendChild(loading);
}

function currentFilterLabel(filtered) {
  const section = SECTION_BY_ID[state.activeSection] || SECTION_BY_ID.hot;
  if (state.siteFilter) {
    const item = filtered[0];
    const stat = currentSiteStats().find((s) => s.site_id === state.siteFilter);
    return `${section.label} · ${item?.site_name || stat?.site_name || state.siteFilter}`;
  }
  return state.activeSection === "hot" ? "热点情报" : `${section.label}情报`;
}

function groupedSites(items) {
  const siteMap = new Map();
  items.forEach((item) => {
    if (!siteMap.has(item.site_id)) {
      siteMap.set(item.site_id, { siteName: item.site_name || item.site_id, items: [] });
    }
    siteMap.get(item.site_id).items.push(item);
  });

  return Array.from(siteMap.entries()).sort((a, b) => {
    const byCount = b[1].items.length - a[1].items.length;
    if (byCount !== 0) return byCount;
    return a[1].siteName.localeCompare(b[1].siteName, "zh-CN");
  });
}

function addLoadMoreButton(parent, label, onClick) {
  const moreBtn = document.createElement("button");
  moreBtn.type = "button";
  moreBtn.className = "list-more-btn";
  moreBtn.textContent = label;
  moreBtn.addEventListener("click", onClick);
  parent.appendChild(moreBtn);
  return moreBtn;
}

function renderList() {
  const filtered = getFilteredItems();
  resultCountEl.textContent = `${fmtNumber(filtered.length)} 条`;
  renderSectionSummary(filtered);

  newsListEl.innerHTML = "";
  _renderListToken += 1;           // invalidate any in-flight render
  const token = _renderListToken;

  if (!filtered.length) {
    const empty = document.createElement("div");
    empty.className = "empty";
    empty.textContent = "当前筛选条件下没有结果。";
    newsListEl.appendChild(empty);
    return;
  }

  renderLoadingNotice(currentFilterLabel(filtered), filtered.length);
  requestAnimationFrame(() => {
    if (token !== _renderListToken) return;   // stale render, abort
    const sorted = state.activeSection === "hot"
      ? filtered
      : [...filtered].sort((a, b) => itemPriorityScore(b) - itemPriorityScore(a) || timelineMs(b) - timelineMs(a));
    newsListEl.innerHTML = "";
    let idx = 0;
    let moreBtn = null;
    const renderNextItems = (count = 24) => {
      if (token !== _renderListToken) return;
      const frag = document.createDocumentFragment();
      sorted.slice(idx, idx + count).forEach((item, offset) => {
        frag.appendChild(buildIntelCard(item, idx + offset + 1));
      });
      idx += count;
      if (moreBtn) moreBtn.remove();
      newsListEl.appendChild(frag);
      if (idx < sorted.length) {
        const nextCount = Math.min(24, sorted.length - idx);
        moreBtn = addLoadMoreButton(newsListEl, `再加载 ${fmtNumber(nextCount)} 条`, () => {
          renderNextItems(24);
        });
      } else {
        document.dispatchEvent(new CustomEvent("aiRadar:listRendered"));
      }
    };
    renderNextItems();
  });
}

function waytoagiViews(waytoagi) {
  const updates7d = Array.isArray(waytoagi?.updates_7d) ? waytoagi.updates_7d : [];
  const latestDate = waytoagi?.latest_date || (updates7d.length ? updates7d[0].date : null);
  const updatesToday = Array.isArray(waytoagi?.updates_today) && waytoagi.updates_today.length
    ? waytoagi.updates_today
    : (latestDate ? updates7d.filter((u) => u.date === latestDate) : []);
  return { updates7d, updatesToday, latestDate };
}

function renderWaytoagi(waytoagi) {
  const { updates7d, updatesToday, latestDate } = waytoagiViews(waytoagi);
  if (waytoagiTodayBtnEl) waytoagiTodayBtnEl.classList.toggle("active", state.waytoagiMode === "today");
  if (waytoagi7dBtnEl) waytoagi7dBtnEl.classList.toggle("active", state.waytoagiMode === "7d");
  waytoagiUpdatedAtEl.textContent = `更新时间：${fmtTime(waytoagi.generated_at)}`;

  waytoagiMetaEl.innerHTML = "";
  const rootLink = document.createElement("a");
  rootLink.href = waytoagi.root_url || "#";
  rootLink.target = "_blank";
  rootLink.rel = "noopener noreferrer";
  rootLink.textContent = "主页面";
  const historyLink = document.createElement("a");
  historyLink.href = waytoagi.history_url || "#";
  historyLink.target = "_blank";
  historyLink.rel = "noopener noreferrer";
  historyLink.textContent = "历史更新页";
  const todayCount = document.createElement("span");
  todayCount.textContent = `最近更新日(${latestDate || "--"})：${fmtNumber(waytoagi.count_today || updatesToday.length)} 条`;
  const weekCount = document.createElement("span");
  weekCount.textContent = `近 7 日：${fmtNumber(waytoagi.count_7d || updates7d.length)} 条`;
  [rootLink, "·", historyLink, "·", todayCount, "·", weekCount].forEach((part) => {
    if (typeof part === "string") {
      const sep = document.createElement("span");
      sep.textContent = part;
      waytoagiMetaEl.appendChild(sep);
    } else {
      waytoagiMetaEl.appendChild(part);
    }
  });

  waytoagiListEl.innerHTML = "";
  if (waytoagi.has_error) {
    const div = document.createElement("div");
    div.className = "waytoagi-error";
    div.textContent = waytoagi.error || "WaytoAGI 数据加载失败";
    waytoagiListEl.appendChild(div);
    return;
  }

  const updates = state.waytoagiMode === "today" ? updatesToday : updates7d;
  if (!updates.length) {
    const div = document.createElement("div");
    div.className = "waytoagi-empty";
    div.textContent = state.waytoagiMode === "today"
      ? "最近更新日没有更新，可切换到近7日查看。"
      : (waytoagi.warning || "近 7 日没有更新");
    waytoagiListEl.appendChild(div);
    return;
  }

  updates.forEach((u) => {
    const row = document.createElement("a");
    row.className = "waytoagi-item";
    row.href = u.url || "#";
    row.target = "_blank";
    row.rel = "noopener noreferrer";
    const dateEl = document.createElement("span");
    dateEl.className = "d";
    dateEl.textContent = fmtDate(u.date);
    const titleEl = document.createElement("span");
    titleEl.className = "t";
    titleEl.textContent = u.title;
    row.append(dateEl, titleEl);
    waytoagiListEl.appendChild(row);
  });
}

function renderMetric(label, value, tone = "") {
  const node = document.createElement("div");
  node.className = `health-metric ${tone}`.trim();
  const labelEl = document.createElement("span");
  labelEl.className = "health-label";
  labelEl.textContent = label;
  const valueEl = document.createElement("strong");
  valueEl.textContent = value;
  node.append(labelEl, valueEl);
  return node;
}

function renderIssueList(title, items) {
  const wrap = document.createElement("div");
  wrap.className = "health-issue";
  const titleEl = document.createElement("div");
  titleEl.className = "health-issue-title";
  titleEl.textContent = title;
  const list = document.createElement("ul");
  items.slice(0, 6).forEach((item) => {
    const li = document.createElement("li");
    li.textContent = typeof item === "string" ? item : JSON.stringify(item);
    list.appendChild(li);
  });
  if (items.length > 6) {
    const li = document.createElement("li");
    li.textContent = `另有 ${fmtNumber(items.length - 6)} 项`;
    list.appendChild(li);
  }
  wrap.append(titleEl, list);
  return wrap;
}

function renderSourceHealth(errorMessage = "") {
  if (!sourceHealthEl) return;
  sourceHealthEl.innerHTML = "";

  const status = state.sourceStatus;
  if (!status) {
    const empty = document.createElement("div");
    empty.className = "health-empty";
    empty.textContent = errorMessage || "源状态未生成";
    sourceHealthEl.appendChild(empty);
    renderAdvancedSummary();
    return;
  }

  const sites = Array.isArray(status.sites) ? status.sites : [];
  const failedSites = Array.isArray(status.failed_sites) ? status.failed_sites : [];
  const zeroSites = Array.isArray(status.zero_item_sites) ? status.zero_item_sites : [];
  const rss = status.rss_opml || {};
  const agentmail = status.agentmail || {};
  const xApi = status.x_api || {};
  const failedFeeds = Array.isArray(rss.failed_feeds) ? rss.failed_feeds : [];
  const skippedFeeds = Array.isArray(rss.skipped_feeds) ? rss.skipped_feeds : [];
  const replacedFeeds = Array.isArray(rss.replaced_feeds) ? rss.replaced_feeds : [];

  const metricGrid = document.createElement("div");
  metricGrid.className = "health-grid";
  metricGrid.append(
    renderMetric("内置源", `${fmtNumber(status.successful_sites || 0)}/${fmtNumber(sites.length)}`, failedSites.length ? "warn" : "ok"),
    renderMetric("RSS", rss.enabled ? `${fmtNumber(rss.ok_feeds || 0)}/${fmtNumber(rss.effective_feed_total || 0)}` : "未启用"),
    renderMetric("X API", xApi.enabled ? (xApi.skipped ? "待窗口" : `${fmtNumber(xApi.item_count || 0)}条`) : "未启用", xApi.error ? "bad" : ""),
    renderMetric("AgentMail", agentmail.enabled ? `${fmtNumber(agentmail.item_count || 0)}封` : "未启用", agentmail.error ? "bad" : ""),
    renderMetric("失败源", fmtNumber(failedSites.length + failedFeeds.length), failedSites.length || failedFeeds.length ? "bad" : "ok"),
    renderMetric("替换/跳过", `${fmtNumber(replacedFeeds.length)}/${fmtNumber(skippedFeeds.length)}`)
  );
  sourceHealthEl.appendChild(metricGrid);

  const issues = document.createElement("div");
  issues.className = "health-issues";
  if (failedSites.length) issues.appendChild(renderIssueList("失败站点", failedSites));
  if (zeroSites.length) issues.appendChild(renderIssueList("零结果站点", zeroSites));
  if (failedFeeds.length) issues.appendChild(renderIssueList("失败 RSS", failedFeeds));
  if (skippedFeeds.length) {
    issues.appendChild(renderIssueList("跳过 RSS", skippedFeeds.map((item) => `${item.feed_url} · ${item.reason || "skipped"}`)));
  }

  if (issues.childElementCount) {
    sourceHealthEl.appendChild(issues);
  } else {
    const ok = document.createElement("div");
    ok.className = "health-ok";
    ok.textContent = "源状态正常";
    sourceHealthEl.appendChild(ok);
  }
  renderAdvancedSummary();
}

async function loadNewsData() {
  const res = await fetch(`./data/latest-24h.json?t=${Date.now()}`);
  if (!res.ok) throw new Error(`加载 latest-24h.json 失败: ${res.status}`);
  return res.json();
}

async function loadAllModeData() {
  if (state.allDataLoaded) return;
  if (!state.allDataPromise) {
    state.allDataPromise = fetch(`./${state.allDataUrl}?t=${Date.now()}`)
      .then((res) => {
        if (!res.ok) throw new Error(`加载 latest-24h-all.json 失败: ${res.status}`);
        return res.json();
      })
      .then((payload) => {
        state.itemsAllRaw = payload.items_all_raw || payload.items_all || state.itemsAi;
        state.itemsAll = payload.items_all || state.itemsAi;
        state.totalRaw = payload.total_items_raw || state.itemsAllRaw.length;
        state.totalAllMode = payload.total_items_all_mode || state.itemsAll.length;
        state.allDataLoaded = true;
      })
      .catch((err) => {
        state.allDataPromise = null;
        throw err;
      });
  }
  return state.allDataPromise;
}

async function loadWaytoagiData() {
  const res = await fetch(`./data/waytoagi-7d.json?t=${Date.now()}`);
  if (!res.ok) throw new Error(`加载 waytoagi-7d.json 失败: ${res.status}`);
  return res.json();
}

async function loadSourceStatusData() {
  const res = await fetch(`./data/source-status.json?t=${Date.now()}`);
  if (!res.ok) throw new Error(`加载 source-status.json 失败: ${res.status}`);
  return res.json();
}

async function loadDailyBriefData() {
  const res = await fetch(`./data/daily-brief.json?t=${Date.now()}`);
  if (!res.ok) throw new Error(`加载 daily-brief.json 失败: ${res.status}`);
  return res.json();
}

async function init() {
  const [newsResult, waytoagiResult, statusResult, briefResult] = await Promise.allSettled([
    loadNewsData(),
    loadWaytoagiData(),
    loadSourceStatusData(),
    loadDailyBriefData(),
  ]);

  if (briefResult.status === "fulfilled") {
    state.dailyBrief = briefResult.value;
  } else {
    state.dailyBrief = null;
  }

  if (newsResult.status === "fulfilled") {
    const payload = newsResult.value;
    state.itemsAi = payload.items_ai || payload.items || [];
    state.itemsAllRaw = payload.items_all_raw || payload.items_all || [];
    state.itemsAll = payload.items_all || [];
    state.statsAi = payload.site_stats || [];
    state.totalAi = payload.total_items || state.itemsAi.length;
    state.totalRaw = payload.total_items_raw || state.itemsAllRaw.length;
    state.totalAllMode = payload.total_items_all_mode || state.itemsAll.length;
    state.allDataUrl = payload.all_mode_data_url || state.allDataUrl;
    state.allDataLoaded = Boolean(payload.items_all || payload.items_all_raw);
    state.generatedAt = payload.generated_at;

    setStats(payload);
    renderSectionTabs();
    renderModeSwitch();
    renderCoverageStrip();
    renderSiteFilters();
    renderBolePicks();
    renderList();
    updatedAtEl.textContent = `更新时间：${fmtTime(state.generatedAt)}`;
  } else {
    updatedAtEl.textContent = "新闻数据加载失败";
    newsListEl.innerHTML = `<div class="empty">${newsResult.reason.message}</div>`;
    renderCoverageStrip(newsResult.reason.message);
  }

  if (statusResult.status === "fulfilled") {
    state.sourceStatus = statusResult.value;
    renderSourceHealth();
    renderCoverageStrip();
  } else {
    renderSourceHealth(statusResult.reason.message);
    renderCoverageStrip(statusResult.reason.message);
  }

  if (waytoagiResult.status === "fulfilled") {
    state.waytoagiData = waytoagiResult.value;
    renderWaytoagi(state.waytoagiData);
  } else {
    waytoagiUpdatedAtEl.textContent = "加载失败";
    waytoagiListEl.innerHTML = `<div class="waytoagi-error">${waytoagiResult.reason.message}</div>`;
  }
}

searchInputEl.addEventListener("input", (e) => {
  state.query = e.target.value;
  renderBolePicks();
  renderList();
});

siteSelectEl.addEventListener("change", (e) => {
  state.siteFilter = e.target.value;
  renderSiteFilters();
  renderBolePicks();
  renderList();
});

modeAiBtnEl.addEventListener("click", () => {
  state.mode = "ai";
  renderSectionTabs();
  renderModeSwitch();
  renderSiteFilters();
  renderBolePicks();
  renderList();
});

modeAllBtnEl.addEventListener("click", async () => {
  state.mode = "all";
  renderModeSwitch();
  newsListEl.innerHTML = "";
  const loading = document.createElement("div");
  loading.className = "empty";
  loading.textContent = "正在加载全量更新...";
  newsListEl.appendChild(loading);
  try {
    await loadAllModeData();
    renderSectionTabs();
    renderModeSwitch();
    renderSiteFilters();
    renderBolePicks();
    renderList();
  } catch (err) {
    newsListEl.innerHTML = "";
    const failed = document.createElement("div");
    failed.className = "empty";
    failed.textContent = err.message;
    newsListEl.appendChild(failed);
  }
});

if (allDedupeToggleEl) {
  allDedupeToggleEl.addEventListener("change", (e) => {
    state.allDedup = Boolean(e.target.checked);
    renderSectionTabs();
    renderModeSwitch();
    renderSiteFilters();
    renderBolePicks();
    renderList();
  });
}

if (waytoagiTodayBtnEl) {
  waytoagiTodayBtnEl.addEventListener("click", () => {
    state.waytoagiMode = "today";
    if (state.waytoagiData) renderWaytoagi(state.waytoagiData);
  });
}

if (waytoagi7dBtnEl) {
  waytoagi7dBtnEl.addEventListener("click", () => {
    state.waytoagiMode = "7d";
    if (state.waytoagiData) renderWaytoagi(state.waytoagiData);
  });
}

if (boleHotBtnEl) {
  boleHotBtnEl.addEventListener("click", () => {
    state.boleView = "hot";
    state.boleExpanded = false;
    renderBolePicks();
  });
}

if (boleTimelineBtnEl) {
  boleTimelineBtnEl.addEventListener("click", () => {
    state.boleView = "timeline";
    state.boleExpanded = false;
    renderBolePicks();
  });
}

init();

// seed-data-sept.js - 9月任务分解器种子数据
// 新版特点：周目标为核心（无日目标）、每个任务带完成度 progress 字段
// 2026年9月日历: 9/1=周二
// W1: 9/1周二-9/4周五(4天) | W2: 9/7周一-9/11周五 | W3: 9/14周一-9/18周五
// W4: 9/21周一-9/25周五 | W5: 9/28周一-9/30周三(3天) | 共22个工作日

const SEPT_CALENDAR = {
  weekdays: {
    1:'周二',2:'周三',3:'周四',4:'周五',5:'周六',6:'周日',
    7:'周一',8:'周二',9:'周三',10:'周四',11:'周五',12:'周六',13:'周日',
    14:'周一',15:'周二',16:'周三',17:'周四',18:'周五',19:'周六',20:'周日',
    21:'周一',22:'周二',23:'周三',24:'周四',25:'周五',26:'周六',27:'周日',
    28:'周一',29:'周二',30:'周三'
  },
  weekMap: {
    1:1,2:1,3:1,4:1,
    7:2,8:2,9:2,10:2,11:2,
    14:3,15:3,16:3,17:3,18:3,
    21:4,22:4,23:4,24:4,25:4,
    28:5,29:5,30:5
  },
  weekWorkdays: {
    1: [1,2,3,4],
    2: [7,8,9,10,11],
    3: [14,15,16,17,18],
    4: [21,22,23,24,25],
    5: [28,29,30]
  },
  weekLabels: {
    1: '9/1周二-9/4周五',
    2: '9/7周一-9/11周五',
    3: '9/14周一-9/18周五',
    4: '9/21周一-9/25周五',
    5: '9/28周一-9/30周三'
  },
  weekTargets: {
    1: '第1周 9/1-9/4', 2: '第2周 9/7-9/11', 3: '第3周 9/14-9/18',
    4: '第4周 9/21-9/25', 5: '第5周 9/28-9/30'
  }
};

function generateSeptemberSeedData() {
  const tasks = [];
  const now = '2026-09-01T00:00:00Z';

  // ===================== 杨景妮 (NINA) =====================
  // 年度目标（合并年度+冲刺）
  tasks.push({
    id: 'sep_nina_annual', owner: '杨景妮', level: 'annual', period: '2026',
    title: '年度目标968万 | 9月目标80万',
    description: '截至8月累计156万，剩余缺口812万，达标需月均203万/月。9月目标：业绩80万·开票30万·报价50万。手头可追：待开票46.55万 + 在途100.37万 + 商机92万。',
    targetAmount: 968, client: '', action: '', expectedResult: '', risk: '',
    status: 'in_progress', priority: '核心', date: '2026', week: 0, progress: 16,
    createdAt: now, updatedAt: now
  });
  tasks.push({
    id: 'sep_nina_monthly', owner: '杨景妮', level: 'monthly', period: '2026-09',
    title: '9月目标：业绩80万',
    description: '开票30万 · 报价50万 · B类客户8家 · B类新增联系人20人 · 外出拜访20家 · 有效跟进200条。用131家分层打法把接触变成合同：出海层=业绩/报价，仿制层=开票，进口层=新客突破。',
    targetAmount: 80, client: '', action: '', expectedResult: '', risk: '',
    status: 'in_progress', priority: '核心', date: '2026-09', week: 0, progress: 0,
    createdAt: now, updatedAt: now
  });
  // 5周目标（80万口径：14.5/18.2/18.2/18.2/10.9，合计80万与月度目标一致）
  tasks.push({
    id: 'sep_nina_w1', owner: '杨景妮', level: 'weekly', period: '2026-W1',
    title: '第1周目标：14.5万 | 信达·和元',
    description: '出海/中美双报资料包报价主攻。本周：外出4家·有效跟进40条·B类联系人4人·新客电话20通。重点转化：杭州/安徽/北京疫苗20万在途、印刷2万+口译3万+校对1.3万待开票确认。',
    targetAmount: 14.5, client: '信达生物·和元生物', action: '申报资料包报价',
    expectedResult: '出海大单报价落地', risk: '大单吃不透·报价无标准价',
    status: 'pending', priority: '必成', date: '2026-09-01', week: 1, progress: 0,
    createdAt: now, updatedAt: now
  });
  tasks.push({
    id: 'sep_nina_w2', owner: '杨景妮', level: 'weekly', period: '2026-W2',
    title: '第2周目标：18.2万 | 康希诺·塔吉瑞',
    description: '疫苗/小分子申报资料推进。本周：外出4家·跟进40条·B类联系人4人·新客电话25通。跟领导跑大客户学打法，请领导在信达/和元牵线。',
    targetAmount: 18.2, client: '康希诺·深圳塔吉瑞', action: '申报推进+高层牵线',
    expectedResult: '双报资料包方案确认', risk: '高层切入难',
    status: 'pending', priority: '必成', date: '2026-09-07', week: 2, progress: 0,
    createdAt: now, updatedAt: now
  });
  tasks.push({
    id: 'sep_nina_w3', owner: '杨景妮', level: 'weekly', period: '2026-W3',
    title: '第3周目标：18.2万 | 鼎泰·迈安纳',
    description: '安评/IND申报绑定出单。本周：外出4家·跟进40条·B类联系人4人·新客电话25通。激活沉睡安评CRO，绑定IND申报节奏；和元CGT、鼎泰安评重点转化。',
    targetAmount: 18.2, client: '江苏鼎泰·迈安纳', action: '安评IND绑定',
    expectedResult: '安评订单签约', risk: '竞对截流',
    status: 'pending', priority: '冲刺', date: '2026-09-14', week: 3, progress: 0,
    createdAt: now, updatedAt: now
  });
  tasks.push({
    id: 'sep_nina_w4', owner: '杨景妮', level: 'weekly', period: '2026-W4',
    title: '第4周目标：18.2万 | 西普拉·万晟·华益',
    description: '仿制药补充/一致性评价资料，收开票。本周：外出4家·跟进40条·B类联系人4人·新客电话25通。唤醒沉睡B级大户（万晟79万两年没动静），报价后3天必回访机制。',
    targetAmount: 18.2, client: '西普拉·浙江万晟·华益', action: '一致性评价资料+催收',
    expectedResult: '沉睡大户激活+开票回收', risk: '回款周期长',
    status: 'pending', priority: '冲刺', date: '2026-09-21', week: 4, progress: 0,
    createdAt: now, updatedAt: now
  });
  tasks.push({
    id: 'sep_nina_w5', owner: '杨景妮', level: 'weekly', period: '2026-W5',
    title: '第5周目标：10.9万 | 安斯泰来·BMS·爱尔康等6家',
    description: '进口注册升温/MNC/器械出海首单突破。本周：外出4家·跟进40条·B类联系人4人·新客电话15通。进口注册资料+医疗器械出海认证文档本地化，月底关单收口。',
    targetAmount: 10.9, client: '安斯泰来·BMS·爱尔康·安健·奕瑞·善思微', action: '进口注册+器械出海首单',
    expectedResult: 'MNC首单突破', risk: '首单决策链长',
    status: 'pending', priority: '补位', date: '2026-09-28', week: 5, progress: 0,
    createdAt: now, updatedAt: now
  });
  // 跨周项目（体现项目完成度）
  tasks.push({
    id: 'sep_nina_p1', owner: '杨景妮', level: 'weekly', period: '2026-09', week: 0,
    title: '项目：申报资料整包报价体系落地',
    description: '公司已有 IND/NDA 整包（CTD多模块、多语种标准模块化报价），9月把它用到信达/和元/深圳/苏州潜在大单上；口译、撰写独立服务线另列不混报。',
    targetAmount: 0, client: '信达·和元·深圳·苏州', action: '标准报价单',
    expectedResult: '模块化报价上线', risk: '无标准价·整包逐单比对',
    status: 'in_progress', priority: '核心', date: '2026-09', week: 0, progress: 20,
    createdAt: now, updatedAt: now
  });
  tasks.push({
    id: 'sep_nina_p2', owner: '杨景妮', level: 'weekly', period: '2026-09', week: 0,
    title: '项目：唤醒沉睡大户 + 每周丢单复盘',
    description: '万晟79万、腾讯医疗93万两年没动静，请领导牵1次线打开高层对话。每周赢/输各记1条，月度汇总成打法；把签下的口译/印刷/撰写案例做成可发客户的1页纸。',
    targetAmount: 0, client: '万晟·腾讯医疗', action: '高层牵线+复盘机制',
    expectedResult: '沉睡大户有进展·打法沉淀', risk: '高层不响应',
    status: 'in_progress', priority: '核心', date: '2026-09', week: 0, progress: 10,
    createdAt: now, updatedAt: now
  });
  tasks.push({
    id: 'sep_nina_p3', owner: '杨景妮', level: 'weekly', period: '2026-09', week: 0,
    title: '项目：经营者思维——自己过单子、拉通项目翻译师',
    description: '每周自己过一遍在手单子：哪卡住、哪要丢，不等领导问先列出。大单启动前拉PM+翻译师对需求和时间，报价准交付稳；每月盯自己的业绩、待开票、报价单。',
    targetAmount: 0, client: '', action: '自主过单+跨部门协作',
    expectedResult: '问题当周暴露·大单一次交付', risk: '',
    status: 'in_progress', priority: '补位', date: '2026-09', week: 0, progress: 15,
    createdAt: now, updatedAt: now
  });

  // ===================== 薛琳 (Shelly) =====================
  tasks.push({
    id: 'sep_shelly_annual', owner: '薛琳', level: 'annual', period: '2026',
    title: '年度目标：追回进度 | 9月目标68万',
    description: '8月完成率25%（17万/68万），9月目标68万+回款25万+外出20家。保底45万在手商机转化（北京新客20万+未签单20万+零散5万）→ 冲刺68万（兆科/科伦博泰/爱科百发追回年度进度）→ 挑战80万（复制北京模式新增2家新客）。',
    targetAmount: 68, client: '', action: '', expectedResult: '', risk: '',
    status: 'in_progress', priority: '核心', date: '2026', week: 0, progress: 25,
    createdAt: now, updatedAt: now
  });
  tasks.push({
    id: 'sep_shelly_monthly', owner: '薛琳', level: 'monthly', period: '2026-09',
    title: '9月目标：业绩68万 · 回款25万',
    description: '外出20家 · 商机转化率提升至40% · 开票清零。每周五17点前提交数据（外出/商机/开票/回款）接受验收。每日动作：拜访2家+电话5家+开票/回款跟进3笔。',
    targetAmount: 68, client: '', action: '', expectedResult: '', risk: '',
    status: 'in_progress', priority: '核心', date: '2026-09', week: 0, progress: 0,
    createdAt: now, updatedAt: now
  });
  tasks.push({
    id: 'sep_shelly_w1', owner: '薛琳', level: 'weekly', period: '2026-W1',
    title: '第1周目标：10万 | 北京商机关单+开票清单',
    description: '开票清单梳理完成+北京商机关单方案落地。32万未开票逐单梳理，9月第1周完成开票清单；北京20万新客已签7.12万，跟进剩余部分；30万开票未到账逐笔跟催明确到账日期。经理协助北京20万新客商机签约谈判。',
    targetAmount: 10, client: '北京安韦拓生物医药', action: '开票清单+商机关单',
    expectedResult: '完成10万·开票清单出炉', risk: '开票流程无人盯节点',
    status: 'in_progress', priority: '必成', date: '2026-09-01', week: 1, progress: 10,
    createdAt: now, updatedAt: now
  });
  tasks.push({
    id: 'sep_shelly_w2', owner: '薛琳', level: 'weekly', period: '2026-W2',
    title: '第2周目标：15万（累计25万）| 大客户回访启动',
    description: '兆科/科伦博泰/爱科百发逐家加密拜访（年度完成率不合格客户全覆盖），高层互访+方案汇报锁定下半年订单。外出6家+经理协同1次（经理陪同拜访科伦博泰/爱科百发）。',
    targetAmount: 15, client: '兆科·科伦博泰·爱科百发', action: '大客户回访+经理协同',
    expectedResult: '头部客户产出20万+启动', risk: '头部客户失速',
    status: 'pending', priority: '必成', date: '2026-09-07', week: 2, progress: 0,
    createdAt: now, updatedAt: now
  });
  tasks.push({
    id: 'sep_shelly_w3', owner: '薛琳', level: 'weekly', period: '2026-W3',
    title: '第3周目标：20万（累计45万）| 未签单20万推进报价',
    description: '中期复盘+未签单剩余20万商机逐一推进到报价+新客开发2家（复制北京"出差-拜访-快速签单"闭环）。药明康德、维健医药年度回访，回访必带方案挖掘增购需求。',
    targetAmount: 20, client: '未签单20万商机+药明康德·维健医药', action: '推进报价+新客开发',
    expectedResult: '商机转化率升至40%', risk: '商机停留在跟进',
    status: 'pending', priority: '冲刺', date: '2026-09-14', week: 3, progress: 0,
    createdAt: now, updatedAt: now
  });
  tasks.push({
    id: 'sep_shelly_w4', owner: '薛琳', level: 'weekly', period: '2026-W4',
    title: '第4周目标：18万（累计63万）| 关单冲刺+回款攻坚',
    description: '关单冲刺+回款攻坚+开票清零。经理协助催收30万开票未到账；开票清单完成50%以上、回款到账10万。爱科百发/科伦博泰/药明康德/维健医药年度回访收口。',
    targetAmount: 18, client: '在途大单+回款客户', action: '关单+催收+开票清零',
    expectedResult: '累计63万·回款到账', risk: '账期管理承压',
    status: 'pending', priority: '冲刺', date: '2026-09-21', week: 4, progress: 0,
    createdAt: now, updatedAt: now
  });
  tasks.push({
    id: 'sep_shelly_w5', owner: '薛琳', level: 'weekly', period: '2026-W5',
    title: '第5周目标：5万（累计68万）| 最终验收',
    description: '最终验收+回款25万收尾+10月计划预排。若前两周未完成25万累计，第三周启动紧急预案：经理介入大单+加密拜访。每月新客户成交不少于2家，建立"当月服务当月开票"节奏。',
    targetAmount: 5, client: '', action: '验收+回款收尾',
    expectedResult: '累计68万达标', risk: '月底集中爆雷',
    status: 'pending', priority: '补位', date: '2026-09-28', week: 5, progress: 0,
    createdAt: now, updatedAt: now
  });
  tasks.push({
    id: 'sep_shelly_p1', owner: '薛琳', level: 'weekly', period: '2026-09', week: 0,
    title: '项目：32万未开票逐单梳理 + 30万到账催收',
    description: '未开票32万逐单梳理，9月第1周完成开票清单；开票未到账30万逐笔跟催，明确到账日期。销售+商务+财务联动，开票节点专人盯办，回款账期共同管理。',
    targetAmount: 0, client: '未开票/未到账客户', action: '开票清单+逐笔催收',
    expectedResult: '开票清零·回款25万', risk: '开票滞后拖累到账',
    status: 'in_progress', priority: '必成', date: '2026-09', week: 0, progress: 15,
    createdAt: now, updatedAt: now
  });
  tasks.push({
    id: 'sep_shelly_p2', owner: '薛琳', level: 'weekly', period: '2026-09', week: 0,
    title: '项目：65万在手商机分级管理',
    description: '65万在手商机分级：当月可签/需培育/暂缓。北京新客20万9月上旬完成签约；未签单剩余20万逐一推进到报价；其余商机分级跟进周周有进展。',
    targetAmount: 0, client: '在手商机', action: '商机分级+周周推进',
    expectedResult: '转化率40%·当月可签全签', risk: '商机推进动作不锋利',
    status: 'in_progress', priority: '核心', date: '2026-09', week: 0, progress: 10,
    createdAt: now, updatedAt: now
  });
  tasks.push({
    id: 'sep_shelly_p3', owner: '薛琳', level: 'weekly', period: '2026-09', week: 0,
    title: '项目：复制"北京出差闭环"+贵人维护',
    description: '复制"出差-拜访-快速签单"闭环打法，出差必带回订单；每月新客成交≥2家。每周至少1次邀请经理协同拜访，建立贵人档案，每季度汇报协助成果。',
    targetAmount: 0, client: '', action: '出差闭环+借力机制',
    expectedResult: '9月新增成交2家新客', risk: '借力习惯未养成',
    status: 'in_progress', priority: '补位', date: '2026-09', week: 0, progress: 5,
    createdAt: now, updatedAt: now
  });

  // ===================== 过健 =====================
  tasks.push({
    id: 'sep_gj_annual', owner: '过健', level: 'annual', period: '2026',
    title: '年度目标450万 | 9月目标150万',
    description: '8月完成率仅10%（10万/100万），9月核心目标业绩150万（较7月实际增长97.7%）| 外出拜访22家 | 新客户成交3家。支撑：欧康维视10万·伯汇10万·三生20万·其他新增40万。',
    targetAmount: 450, client: '', action: '', expectedResult: '', risk: '',
    status: 'in_progress', priority: '核心', date: '2026', week: 0, progress: 10,
    createdAt: now, updatedAt: now
  });
  tasks.push({
    id: 'sep_gj_monthly', owner: '过健', level: 'monthly', period: '2026-09',
    title: '9月目标：业绩150万 · 外出22家 · 新客3家',
    description: 'A类客户外出：欧康(2)·三生(3)·广生·特宝·美诺华研究院·先声·上药·复星·东诚；8家B类以上+8家新客户。聚焦"新客开发+回款攻坚"两大P0事项，保持95%签单率优势。',
    targetAmount: 150, client: '', action: '', expectedResult: '', risk: '',
    status: 'in_progress', priority: '核心', date: '2026-09', week: 0, progress: 0,
    createdAt: now, updatedAt: now
  });
  tasks.push({
    id: 'sep_gj_w1', owner: '过健', level: 'weekly', period: '2026-W1',
    title: '第1周目标：30万 | 欧康维视·伯汇',
    description: '欧康维视NDA申报项目10万+伯汇10万报价/复购+三生10万。A类外出欧康，京新潜在BD项目持续跟进。执行保障：每日CRM客户跟进记录更新。',
    targetAmount: 30, client: '欧康维视·伯汇·三生', action: '报价/复购',
    expectedResult: '欧康NDA报价落地', risk: '开票拖沓',
    status: 'in_progress', priority: '必成', date: '2026-09-01', week: 1, progress: 5,
    createdAt: now, updatedAt: now
  });
  tasks.push({
    id: 'sep_gj_w2', owner: '过健', level: 'weekly', period: '2026-W2',
    title: '第2周目标：35万 | 三生深耕',
    description: '三生制药20万深度回访3次+广生/特宝推进。三生深耕6次（8月已做），9月持续；欧康维视维护良好，挖掘增购。周一下午团队例会。',
    targetAmount: 35, client: '三生制药·广生·特宝', action: '深度回访+深耕',
    expectedResult: '三生大单确认', risk: '大客户尚未完全发力',
    status: 'pending', priority: '必成', date: '2026-09-07', week: 2, progress: 0,
    createdAt: now, updatedAt: now
  });
  tasks.push({
    id: 'sep_gj_w3', owner: '过健', level: 'weekly', period: '2026-W3',
    title: '第3周目标：35万 | 上药·复星·东诚',
    description: '新客户开发拜访：上药/复星/东诚等A类+B类以上客户。新客户成交率低是P0问题，本周重点新客破零；先声药业询价丢单复盘，避免重复踩坑。',
    targetAmount: 35, client: '上药·复星·东诚', action: '新客开发+报价',
    expectedResult: '新客首单或报价', risk: '客户断层风险',
    status: 'pending', priority: '冲刺', date: '2026-09-14', week: 3, progress: 0,
    createdAt: now, updatedAt: now
  });
  tasks.push({
    id: 'sep_gj_w4', owner: '过健', level: 'weekly', period: '2026-W4',
    title: '第4周目标：35万 | 美诺华研究院·先声',
    description: '美诺华研究院/先声商机转化推进。15条商机打分排序、按金额×概率优先重点跟进高价值商机，每周更新商机状态、设置阶段转化目标。周五下午回款跟进。',
    targetAmount: 35, client: '美诺华研究院·先声', action: '商机转化+回款',
    expectedResult: '商机转签约', risk: '报价线索不足',
    status: 'pending', priority: '冲刺', date: '2026-09-21', week: 4, progress: 0,
    createdAt: now, updatedAt: now
  });
  tasks.push({
    id: 'sep_gj_w5', owner: '过健', level: 'weekly', period: '2026-W5',
    title: '第5周目标：15万 | 商机关单冲刺',
    description: '商机关单冲刺+新客户成交3家收口。月度回款监控，未收款项风险预警；"1+N"服务策略提升AB类客户渗透率。月底关单、10月计划预排。',
    targetAmount: 15, client: '', action: '关单冲刺+新客收口',
    expectedResult: '150万达标·新客3家', risk: '坏账风险',
    status: 'pending', priority: '补位', date: '2026-09-28', week: 5, progress: 0,
    createdAt: now, updatedAt: now
  });
  tasks.push({
    id: 'sep_gj_p1', owner: '过健', level: 'weekly', period: '2026-09', week: 0,
    title: '项目：15条商机打分排序+回款攻坚',
    description: '商机打分排序：按金额×概率优先，每周更新商机状态，设置阶段转化目标。回款攻坚：半年到款率55%偏低，开票拖沓整改，建立月度回款监控表，未收款项风险预警。',
    targetAmount: 0, client: '在手商机', action: '商机打分+回款监控',
    expectedResult: '到款率提升·商机转化提速', risk: '报价线索不足',
    status: 'in_progress', priority: '核心', date: '2026-09', week: 0, progress: 25,
    createdAt: now, updatedAt: now
  });
  tasks.push({
    id: 'sep_gj_p2', owner: '过健', level: 'weekly', period: '2026-09', week: 0,
    title: '项目：新客户开发3家（当前0家）',
    description: '8月新客成交0家、在跟进线索仅2家，客户断层风险明显。9月需再开发3-5家稳定客户，聚焦CRO、临床试验文档翻译等高增长细分领域，把握医药出海趋势。',
    targetAmount: 0, client: '新客户', action: '新客破零+开发',
    expectedResult: '新客成交3家', risk: '客户断层',
    status: 'in_progress', priority: '必成', date: '2026-09', week: 0, progress: 5,
    createdAt: now, updatedAt: now
  });
  tasks.push({
    id: 'sep_gj_p3', owner: '过健', level: 'weekly', period: '2026-09', week: 0,
    title: '项目：数据化管理+主动对接高层',
    description: '建立客户分级跟踪表、商机漏斗模型、月度回款监控表，用数据驱动销售决策。重塑：销售对客户把控度不足，主动对接高层，先把高层需求搞清楚。',
    targetAmount: 0, client: '', action: '数据化管理+高层对接',
    expectedResult: '客户把控度提升', risk: '',
    status: 'in_progress', priority: '补位', date: '2026-09', week: 0, progress: 10,
    createdAt: now, updatedAt: now
  });

  // ===================== 陆华 =====================
  tasks.push({
    id: 'sep_lh_annual', owner: '陆华', level: 'annual', period: '2026',
    title: '年度目标：冲刺关键月 | 9月目标108万',
    description: '8月完成率16.9%（18.3万/108万），年度累计23.7%。9月目标：业绩108万·开票50万·回款50万·外出20家。近100万商机池（先为达39万+信达20万丢单复盘+济煜10万+潜在40万）储备充足。',
    targetAmount: 108, client: '', action: '', expectedResult: '', risk: '',
    status: 'in_progress', priority: '核心', date: '2026', week: 0, progress: 17,
    createdAt: now, updatedAt: now
  });
  tasks.push({
    id: 'sep_lh_monthly', owner: '陆华', level: 'monthly', period: '2026-09',
    title: '9月目标：业绩108万 · 开票50万 · 回款50万',
    description: '外出20家。重点客户突破：惠升（重点攻坚大单）·信达（复盘二次突破）·正大天晴（深度经营）·顺欣/再明/金赛/济煜（稳步推进）。出差：北京拓北方市场·深圳广州转化NDA线索。每访必有产出。',
    targetAmount: 108, client: '', action: '', expectedResult: '', risk: '',
    status: 'in_progress', priority: '核心', date: '2026-09', week: 0, progress: 0,
    createdAt: now, updatedAt: now
  });
  tasks.push({
    id: 'sep_lh_w1', owner: '陆华', level: 'weekly', period: '2026-W1',
    title: '第1周目标：40万 | 先为达·济煜·泰德·现代法语·正大德谷',
    description: '商机100万·开票25·外出5·新增人6·电话45。先为达（数据库翻译30W，对接BD总）·济煜翻译需求（联系临床领导）·泰德GMP（联系医学）·现代法语（了解进度+河南公司）·正大德谷（联系BD与注册）·北京新客户欧盟申报（推进框架协议）。',
    targetAmount: 40, client: '先为达·济煜·泰德·现代法语·正大德谷·北京新客', action: '线索对接+开票',
    expectedResult: '先为达30W报价推进', risk: '信达丢单教训',
    status: 'in_progress', priority: '必成', date: '2026-09-01', week: 1, progress: 5,
    createdAt: now, updatedAt: now
  });
  tasks.push({
    id: 'sep_lh_w2', owner: '陆华', level: 'weekly', period: '2026-W2',
    title: '第2周目标：20万 | 信达·再明·正大·惠升·康龙化成',
    description: '商机100万·开票10·外出5·新增人6·电话45。信达项目（拜访+展会高管约访+维护采购，复盘二次突破）·再明（新增人+展会联系人）·正大（上海约拜访）·惠升潜在项目·新客户撰写3篇·康龙化成进口（BD搭建注册架构）·贵州新客户（约会议）。',
    targetAmount: 20, client: '信达·再明·正大·惠升·康龙化成·贵州新客', action: '信达二次突破+拜访',
    expectedResult: '信达挽回信任', risk: '决策链渗透不足',
    status: 'pending', priority: '必成', date: '2026-09-07', week: 2, progress: 0,
    createdAt: now, updatedAt: now
  });
  tasks.push({
    id: 'sep_lh_w3', owner: '陆华', level: 'weekly', period: '2026-W3',
    title: '第3周目标：20万 | 正大连云港·一品红·金赛·合源',
    description: '商机100万·开票10·外出5·新增人6·电话45。正大（连云港项目推进）·一品红（了解IND进度与数据翻译）·再明（寻找注册）·金赛（找到长春质量负责人）·合源（寻找项目需求）。',
    targetAmount: 20, client: '正大·一品红·再明·金赛·合源', action: '重点项目推进',
    expectedResult: 'IND数据翻译机会落地', risk: '刷脸式拜访',
    status: 'pending', priority: '冲刺', date: '2026-09-14', week: 3, progress: 0,
    createdAt: now, updatedAt: now
  });
  tasks.push({
    id: 'sep_lh_w4', owner: '陆华', level: 'weekly', period: '2026-W4',
    title: '第4周目标：28万 | 回访出差客户·催款·关单冲刺',
    description: '商机100万·开票5·外出5·新增人6·电话45。回访近期出差客户·催款20万·冲刺业绩28万。深圳广州持续跟进转化NDA线索，深化一品红合作；leader陪访高层背书攻坚关键决策人。',
    targetAmount: 28, client: '近期出差客户+深圳广州线索', action: '回访+催款+关单',
    expectedResult: '108万达标·回款50万', risk: '无大订单录入',
    status: 'pending', priority: '冲刺', date: '2026-09-21', week: 4, progress: 0,
    createdAt: now, updatedAt: now
  });
  tasks.push({
    id: 'sep_lh_p1', owner: '陆华', level: 'weekly', period: '2026-09', week: 0,
    title: '项目：惠升重点攻坚 + 信达丢单复盘二次突破',
    description: '惠升重点攻坚争取大单突破；信达20万丢单复盘五大问题（跟进不及时/分工不清/联系人不足/高层背书缺失/无内应）逐一整改：建立客户决策日历、明确项目Owner、绘制组织架构图、邀请高层参与拜访、培养客户内部支持者。',
    targetAmount: 0, client: '惠升·信达', action: '攻坚+复盘整改',
    expectedResult: '惠升大单·信达挽回', risk: '丢单重演',
    status: 'in_progress', priority: '核心', date: '2026-09', week: 0, progress: 20,
    createdAt: now, updatedAt: now
  });
  tasks.push({
    id: 'sep_lh_p2', owner: '陆华', level: 'weekly', period: '2026-09', week: 0,
    title: '项目：从"刷脸式"到"经营型"销售',
    description: '26次外出但商机报价量未上来——每次客户接触都要带来业务洞察或解决方案价值，明确拜访目标与产出标准，杜绝刷脸式外出。从"拜访量"转向"拜访质"，将客户痛点转化为内部改进需求。',
    targetAmount: 0, client: '', action: '拜访质提升',
    expectedResult: '外出产出率提升', risk: '效率低下',
    status: 'in_progress', priority: '核心', date: '2026-09', week: 0, progress: 10,
    createdAt: now, updatedAt: now
  });
  tasks.push({
    id: 'sep_lh_p3', owner: '陆华', level: 'weekly', period: '2026-09', week: 0,
    title: '项目：回款/开票双轨管控',
    description: '8月回款46万超额115%，但未开票68万+开票未到账71万共139万待处理。9月开票50万/回款50万目标，尽快推进开票流程、加强催收跟进，确保现金流健康。',
    targetAmount: 0, client: '', action: '开票+催收',
    expectedResult: '开票50万·回款50万', risk: '139万待处理积压',
    status: 'in_progress', priority: '必成', date: '2026-09', week: 0, progress: 30,
    createdAt: now, updatedAt: now
  });

  // ===================== 刘童 (Ace) =====================
  tasks.push({
    id: 'sep_lt_annual', owner: '刘童', level: 'annual', period: '2026',
    title: '年度目标：100万+ | 9月目标100万',
    description: '8月完成100%（100万），但甘李一家贡献70.8%风险极高。9月策略"去集中化"：甘李占比70.8%降至30%，甘李30万·脉亿链20万·康联达10万·BLA10万·辉瑞1万·科曼2万·医药/医疗新客户27万=100万。',
    targetAmount: 100, client: '', action: '', expectedResult: '', risk: '',
    status: 'in_progress', priority: '核心', date: '2026', week: 0, progress: 100,
    createdAt: now, updatedAt: now
  });
  tasks.push({
    id: 'sep_lt_monthly', owner: '刘童', level: 'monthly', period: '2026-09',
    title: '9月目标：业绩100万+ · 拜访20次+',
    description: '甘李30万（拜访从1次提至3次+）·脉亿链20万（增长233%）·康联达10万（新增）·BLA10万（新增）·辉瑞1万·科曼2万·医药/医疗新客户27万。拜访聚焦甘李、脉亿链、康联达、BLA四大核心客户。',
    targetAmount: 100, client: '', action: '', expectedResult: '', risk: '',
    status: 'in_progress', priority: '核心', date: '2026-09', week: 0, progress: 0,
    createdAt: now, updatedAt: now
  });
  tasks.push({
    id: 'sep_lt_w1', owner: '刘童', level: 'weekly', period: '2026-W1',
    title: '第1周目标：25万 | 甘李拜访3次+',
    description: '甘李12人合作网络维护+拜访从1次提至3次，山东/北京项目链接；康联达新客户启动开发。核心客户1-2次拜访即产单，保持高转化。',
    targetAmount: 25, client: '甘李·康联达', action: '甘李深度拜访+康联达开发',
    expectedResult: '甘李复购15万+', risk: '单一客户依赖',
    status: 'in_progress', priority: '必成', date: '2026-09-01', week: 1, progress: 5,
    createdAt: now, updatedAt: now
  });
  tasks.push({
    id: 'sep_lt_w2', owner: '刘童', level: 'weekly', period: '2026-W2',
    title: '第2周目标：25万 | 脉亿链+ BLA',
    description: '脉亿链20万（增长233%）：组合采购提升客单价，从6万增购至20万；BLA新客户10万推进报价。36次外出重新分配，聚焦高价值客户。',
    targetAmount: 25, client: '脉亿链·BLA', action: '增购+新客报价',
    expectedResult: '脉亿链增购确认', risk: '客单价差异6倍',
    status: 'pending', priority: '必成', date: '2026-09-07', week: 2, progress: 0,
    createdAt: now, updatedAt: now
  });
  tasks.push({
    id: 'sep_lt_w3', owner: '刘童', level: 'weekly', period: '2026-W3',
    title: '第3周目标：25万 | 康联达·BLA新客成交',
    description: '康联达10万+BLA10万新客户成交收口；医药/医疗新客户触达（周均3-4家新客拜访）。甘李12人合作模式复制到新客户，建立多人协作网络。',
    targetAmount: 25, client: '康联达·BLA·新客户', action: '新客成交+模式复制',
    expectedResult: '康联达+BLA签约', risk: '新客户转化慢',
    status: 'pending', priority: '冲刺', date: '2026-09-14', week: 3, progress: 0,
    createdAt: now, updatedAt: now
  });
  tasks.push({
    id: 'sep_lt_w4', owner: '刘童', level: 'weekly', period: '2026-W4',
    title: '第4周目标：25万 | 甘李收口+新客27万冲刺',
    description: '甘李30万收口+医药/医疗新客户27万冲刺（辉瑞1万·科曼2万等）。去集中化验证：甘李占比降至30%，第二增长曲线成型。月底关单、10月预排。',
    targetAmount: 25, client: '甘李·辉瑞·科曼·新客户', action: '关单冲刺',
    expectedResult: '100万达标·结构优化', risk: '甘李订单波动',
    status: 'pending', priority: '冲刺', date: '2026-09-21', week: 4, progress: 0,
    createdAt: now, updatedAt: now
  });
  tasks.push({
    id: 'sep_lt_p1', owner: '刘童', level: 'weekly', period: '2026-09', week: 0,
    title: '项目：甘李12人合作模式复制',
    description: '甘李12人合作网络17单/月、人均产出5.9万——复制到康联达、BLA等大客户，建立多人协作网络；高拜访转化率经验固化，优化拜访前准备，提升每次拜访产出。',
    targetAmount: 0, client: '甘李模式→康联达·BLA', action: '模式复制',
    expectedResult: '第二增长曲线', risk: '复制走样',
    status: 'in_progress', priority: '核心', date: '2026-09', week: 0, progress: 15,
    createdAt: now, updatedAt: now
  });
  tasks.push({
    id: 'sep_lt_p2', owner: '刘童', level: 'weekly', period: '2026-09', week: 0,
    title: '项目：降低客户集中度 + 提升客单价',
    description: '客户集中度过高（甘李70.8%）——重点开发康联达、BLA等新客户；中小客户推动组合采购提升客单价（甘李客单价4.16万 vs 其他0.70万，差距6倍）。',
    targetAmount: 0, client: '', action: '分散风险+组合采购',
    expectedResult: '甘李占比降至30%', risk: '新客贡献不足',
    status: 'in_progress', priority: '必成', date: '2026-09', week: 0, progress: 10,
    createdAt: now, updatedAt: now
  });
  tasks.push({
    id: 'sep_lt_p3', owner: '刘童', level: 'weekly', period: '2026-09', week: 0,
    title: '项目：术语库治理 + 经营型组织建设',
    description: '发现客户连续询问同类医学术语、排版频繁返工：主动排查公司术语库，同步最新CDE指南，项目交接单增加"术语偏好"勾选项。以经营者角度看待项目反馈，稳定情绪、主动解决问题。',
    targetAmount: 0, client: '', action: '术语库治理',
    expectedResult: '返工成本下降', risk: '',
    status: 'in_progress', priority: '补位', date: '2026-09', week: 0, progress: 20,
    createdAt: now, updatedAt: now
  });

  return { tasks, calendar: SEPT_CALENDAR };
}

module.exports = { generateSeptemberSeedData, SEPT_CALENDAR };

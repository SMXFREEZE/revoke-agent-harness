/* ============================================================================
   GutGutGoose · MetaScope™ — in-browser shotgun-metagenomics engine
   ----------------------------------------------------------------------------
   A faithful, educational reimplementation of the core of a real metagenomic
   pipeline (think a tiny Kraken2 + Bracken + alpha-diversity in one file):

     FASTQ  ->  QC (reads, Phred Q, GC, Q30)
            ->  canonical k-mer index of the reference genomes
            ->  per-read k-mer voting + LCA-style assignment
            ->  relative abundance (% of classified reads)
            ->  alpha diversity (Shannon, Simpson, richness, evenness)
            ->  phylum composition, F/B ratio, enterotype
            ->  per-taxon status vs healthy range
            ->  evidence-based probiotic recommendation engine

   It runs on the synthetic mock-community FASTQ the same way CAMISIM /
   InSilicoSeq mock communities are used to validate real classifiers — the
   reference k-mers recover the planted abundances. Pure vanilla JS, no deps.
   ========================================================================== */
(function (global) {
  'use strict';

  const COMP = { A: 'T', T: 'A', G: 'C', C: 'G', N: 'N' };

  function revComp(s) {
    let o = '';
    for (let i = s.length - 1; i >= 0; i--) o += COMP[s[i]] || 'N';
    return o;
  }
  // canonical k-mer = lexicographically smaller of (kmer, reverse-complement)
  function canonical(kmer) {
    const rc = revComp(kmer);
    return kmer <= rc ? kmer : rc;
  }

  /* ---- FASTQ parsing -------------------------------------------------- */
  function parseFastq(text) {
    const reads = [];
    let i = 0;
    const n = text.length;
    // hand-rolled line scan (robust to \n and \r\n, large strings)
    function nextLine() {
      if (i >= n) return null;
      let j = text.indexOf('\n', i);
      if (j === -1) j = n;
      let line = text.slice(i, j);
      if (line.endsWith('\r')) line = line.slice(0, -1);
      i = j + 1;
      return line;
    }
    while (i < n) {
      const h = nextLine();
      if (h === null) break;
      if (h === '') continue;
      const seq = nextLine();
      const plus = nextLine();
      const qual = nextLine();
      if (seq === null || qual === null) break;
      if (h[0] !== '@') continue; // tolerate stray lines
      reads.push({ seq: seq.toUpperCase(), qual });
    }
    return reads;
  }

  /* ---- Quality control ------------------------------------------------ */
  const ADAPTERS = [
    'AGATCGGAAGAGC', // Illumina TruSeq universal adapter
    'CTGTCTCTTATACACATCT', // Illumina/Nextera transposase adapter
  ];

  function summarizeReads(reads) {
    let totalBases = 0, gc = 0, qSum = 0, qCount = 0, q30 = 0, minLen = Infinity, maxLen = 0;
    // per-read mean-Q histogram over Q[16..40] in 12 bins (for a sparkline)
    const QLO = 16, QHI = 40, BINS = 12, qHist = new Array(BINS).fill(0);
    for (const r of reads) {
      const L = r.seq.length;
      totalBases += L;
      if (L < minLen) minLen = L;
      if (L > maxLen) maxLen = L;
      for (let k = 0; k < L; k++) {
        const c = r.seq[k];
        if (c === 'G' || c === 'C') gc++;
      }
      let rq = 0;
      for (let k = 0; k < r.qual.length; k++) {
        const Q = r.qual.charCodeAt(k) - 33;
        qSum += Q; qCount++; rq += Q;
        if (Q >= 30) q30++;
      }
      const mean = r.qual.length ? rq / r.qual.length : 0;
      let bi = Math.floor(((mean - QLO) / (QHI - QLO)) * BINS);
      qHist[Math.max(0, Math.min(BINS - 1, bi))]++;
    }
    return {
      reads: reads.length,
      totalBases,
      meanLen: reads.length ? totalBases / reads.length : 0,
      minLen: isFinite(minLen) ? minLen : 0,
      maxLen,
      gcPct: totalBases ? (100 * gc) / totalBases : 0,
      meanQ: qCount ? qSum / qCount : 0,
      q30Pct: qCount ? (100 * q30) / qCount : 0,
      qHist, qLo: QLO, qHi: QHI,
    };
  }

  function meanPhred(qual) {
    if (!qual.length) return 0;
    let sum = 0;
    for (let i = 0; i < qual.length; i++) sum += Math.max(0, qual.charCodeAt(i) - 33);
    return sum / qual.length;
  }

  // Trim known adapters and low-quality ends, then reject reads that remain too
  // short, too ambiguous, or too low-quality. The returned reads are the only
  // reads allowed into k-mer classification and downstream calculations.
  function filterReads(reads, options) {
    options = options || {};
    const minLength = options.minLength == null ? 30 : options.minLength;
    const minBaseQ = options.minBaseQ == null ? 20 : options.minBaseQ;
    const minMeanQ = options.minMeanQ == null ? 20 : options.minMeanQ;
    const maxAmbiguousPct = options.maxAmbiguousPct == null ? 5 : options.maxAmbiguousPct;
    const minReportReads = options.minReportReads == null ? 20 : options.minReportReads;
    const minPassPct = options.minPassPct == null ? 70 : options.minPassPct;
    const retained = [];
    const rejectedReasons = { malformed: 0, tooShort: 0, lowMeanQ: 0, tooAmbiguous: 0 };
    let adapterTrimmedReads = 0, qualityTrimmedReads = 0, trimmedBases = 0;

    for (const original of reads) {
      const rawSeq = String(original && original.seq || '').toUpperCase();
      const rawQual = String(original && original.qual || '');
      const pairedLength = Math.min(rawSeq.length, rawQual.length);
      if (!pairedLength) { rejectedReasons.malformed++; continue; }

      let seq = rawSeq.slice(0, pairedLength);
      let qual = rawQual.slice(0, pairedLength);
      let adapterAt = seq.length;
      for (const adapter of ADAPTERS) {
        const at = seq.indexOf(adapter);
        if (at !== -1 && at < adapterAt) adapterAt = at;
      }
      if (adapterAt < seq.length) {
        trimmedBases += seq.length - adapterAt;
        seq = seq.slice(0, adapterAt);
        qual = qual.slice(0, adapterAt);
        adapterTrimmedReads++;
      }

      let start = 0, end = qual.length;
      while (start < end && qual.charCodeAt(start) - 33 < minBaseQ) start++;
      while (end > start && qual.charCodeAt(end - 1) - 33 < minBaseQ) end--;
      if (start > 0 || end < qual.length) {
        trimmedBases += start + (qual.length - end);
        seq = seq.slice(start, end);
        qual = qual.slice(start, end);
        qualityTrimmedReads++;
      }

      if (seq.length < minLength) { rejectedReasons.tooShort++; continue; }
      if (meanPhred(qual) < minMeanQ) { rejectedReasons.lowMeanQ++; continue; }
      let ambiguous = 0;
      for (let i = 0; i < seq.length; i++) if (seq[i] === 'N') ambiguous++;
      if ((100 * ambiguous) / seq.length > maxAmbiguousPct) { rejectedReasons.tooAmbiguous++; continue; }
      retained.push({ seq, qual });
    }

    const summary = summarizeReads(retained);
    const rawReads = reads.length;
    const passPct = rawReads ? (100 * retained.length) / rawReads : 0;
    const qualityGatePassed = retained.length >= minReportReads
      && passPct >= minPassPct
      && summary.meanQ >= minMeanQ;
    return {
      reads: retained,
      quality: {
        ...summary,
        rawReads,
        filteredReads: rawReads - retained.length,
        passPct,
        adapterTrimmedReads,
        qualityTrimmedReads,
        trimmedBases,
        rejectedReasons,
        thresholds: { minLength, minBaseQ, minMeanQ, maxAmbiguousPct, minReportReads, minPassPct },
        qualityGatePassed,
      },
    };
  }

  function qc(reads, options) {
    return filterReads(reads, options).quality;
  }

  // ---- composite clinical indices (0–100, plain-language scores) -------
  function scores(byIdPct, phylum, div, taxaById) {
    const get = (id) => byIdPct[id] || 0;
    const clamp = (x) => Math.max(0, Math.min(100, Math.round(x)));
    // SCFA / butyrate potential: keystone-weighted (F. prausnitzii counts double)
    // against a ~30% healthy target, so a low-fprau gut can't max the score.
    const butyrate = 2 * get('fprau') + get('rosin') + get('erect') + get('rbrom');
    const scfa = clamp((butyrate / 30) * 100);
    // Dysbiosis index: Proteobacteria bloom + beneficial deficits
    const prote = phylum.Proteobacteria || 0;
    let deficit = 0;
    ['fprau', 'blong', 'akker', 'lacto'].forEach((id) => {
      const t = taxaById[id]; if (!t) return;
      if (get(id) < t.healthyLo) deficit += (t.healthyLo - get(id)) / t.healthyLo;
    });
    const dysbiosis = clamp(prote * 7 + deficit * 18);
    // Gut resilience: diversity + beneficial coverage − dysbiosis
    const benefBars = Object.keys(taxaById).filter((id) => taxaById[id].named && taxaById[id].concern === 'low');
    const okCount = benefBars.filter((id) => get(id) >= taxaById[id].healthyLo).length;
    const coverage = benefBars.length ? okCount / benefBars.length : 0;
    const resilience = clamp(38 * (div.shannon / 4) + 34 * coverage + 28 * (1 - dysbiosis / 100));
    return { scfa, dysbiosis, resilience };
  }

  /* ---- Reference k-mer index ----------------------------------------- */
  function buildIndex(reference) {
    const k = reference.k || 21;
    const kmerToTaxon = new Map();   // canonical kmer -> taxon id (or '*' if ambiguous)
    for (const t of reference.taxa) {
      const g = t.genome;
      for (let p = 0; p + k <= g.length; p++) {
        const can = canonical(g.slice(p, p + k));
        const cur = kmerToTaxon.get(can);
        if (cur === undefined) kmerToTaxon.set(can, t.id);
        else if (cur !== t.id) kmerToTaxon.set(can, '*'); // shared -> ambiguous (LCA drop)
      }
    }
    return { k, kmerToTaxon, distinctKmers: kmerToTaxon.size };
  }

  /* ---- Classify one read by k-mer voting ----------------------------- */
  function classifyRead(seq, index, minHits) {
    const { k, kmerToTaxon } = index;
    const votes = Object.create(null);
    let best = null, bestV = 0, informative = 0;
    for (let p = 0; p + k <= seq.length; p++) {
      const sub = seq.slice(p, p + k);
      if (sub.indexOf('N') !== -1) continue;
      const tid = kmerToTaxon.get(canonical(sub));
      if (tid === undefined || tid === '*') continue;
      informative++;
      const v = (votes[tid] = (votes[tid] || 0) + 1);
      if (v > bestV) { bestV = v; best = tid; }
    }
    if (best !== null && bestV >= minHits) return best;
    return null; // unclassified
  }

  /* ---- Diversity & ecology metrics ----------------------------------- */
  function diversity(countsById) {
    const ids = Object.keys(countsById);
    let total = 0;
    for (const id of ids) total += countsById[id];
    let shannon = 0, simpson = 0, richness = 0;
    for (const id of ids) {
      const c = countsById[id];
      if (c <= 0) continue;
      richness++;
      const p = c / total;
      shannon -= p * Math.log(p);
      simpson += p * p;
    }
    const evenness = richness > 1 ? shannon / Math.log(richness) : 0;
    return { shannon, simpson: 1 - simpson, richness, evenness, total };
  }

  /* ---- Probiotic recommendation knowledge base ----------------------- */
  // Grounded, non-overclaiming rules. Each rule fires on a measured signal and
  // proposes an evidence-based strain with a plain-language benefit.
  const STRAIN_KB = {
    blong: {
      strain: 'Bifidobacterium longum',
      tag: 'Keystone bifido',
      benefit: 'Eases bloating, supports regularity and a calmer immune response.',
      evidence: 'Well-studied; multiple RCTs for bloating, IBS and immune support.',
      cfu: '10 billion CFU/day',
    },
    akker: {
      strain: 'Akkermansia muciniphila (next-gen)',
      tag: 'Mucus-layer guardian',
      benefit: 'Strengthens the gut mucus barrier; linked to healthier metabolism.',
      evidence: 'Emerging next-gen probiotic; promising human pilot trials.',
      cfu: 'Pasteurised Akk, 10 billion cells/day',
    },
    butyrate: {
      strain: 'Butyrate-restoration blend + prebiotic (inulin/FOS)',
      tag: 'Butyrate support',
      benefit: 'Feeds your own butyrate makers to soothe the gut lining and steady energy.',
      evidence: 'Prebiotic fibres reliably raise butyrate producers like F. prausnitzii.',
      cfu: '5 g prebiotic fibre/day, ramped slowly',
    },
    lacto: {
      strain: 'Lactobacillus rhamnosus GG',
      tag: 'All-rounder',
      benefit: 'Helps keep unfriendly microbes in check and supports recovery after antibiotics.',
      evidence: 'One of the most-studied probiotic strains in the world.',
      cfu: '10–20 billion CFU/day',
    },
    boulardii: {
      strain: 'Saccharomyces boulardii',
      tag: 'Opportunist control',
      benefit: 'A friendly yeast that helps crowd out opportunists during a Proteobacteria bloom.',
      evidence: 'Strong evidence for antibiotic-associated and travellers’ digestive upset.',
      cfu: '5–10 billion CFU/day',
    },
    diversity: {
      strain: 'Polyphenol + 30-plants-a-week food plan',
      tag: 'Diversity builder',
      benefit: 'Broadens your microbiome so it’s more resilient and less reactive.',
      evidence: 'Plant diversity is the strongest dietary driver of microbiome richness.',
      cfu: 'Dietary — no capsule',
    },
  };

  function recommend(byId, taxaById, div, phylum) {
    const recs = [];
    const status = (id) => {
      const t = taxaById[id]; if (!t) return null;
      const v = byId[id] || 0;
      if (t.concern === 'low' && v < t.healthyLo) return 'low';
      if (t.concern === 'high' && v > t.healthyHi) return 'high';
      return 'ok';
    };
    if (status('blong') === 'low' || status('badol') === 'low')
      recs.push({ ...STRAIN_KB.blong, why: `Your Bifidobacterium is low (B. longum ${ (byId.blong||0).toFixed(1) }%, below ${taxaById.blong.healthyLo}%).` });
    if (status('fprau') === 'low' || (byId.fprau||0) + (byId.rosin||0) + (byId.erect||0) < 14)
      recs.push({ ...STRAIN_KB.butyrate, why: `Butyrate makers are running low (F. prausnitzii ${ (byId.fprau||0).toFixed(1) }%).` });
    if (status('akker') === 'low')
      recs.push({ ...STRAIN_KB.akker, why: `Akkermansia is low (${ (byId.akker||0).toFixed(2) }%, below ${taxaById.akker.healthyLo}%).` });
    if (status('ecoli') === 'high' || status('klebs') === 'high' || (phylum.Proteobacteria || 0) > 4)
      recs.push({ ...STRAIN_KB.boulardii, why: `Proteobacteria are elevated (${(phylum.Proteobacteria||0).toFixed(1)}%) — E. coli & Klebsiella above range.` });
    if (status('lacto') === 'low')
      recs.push({ ...STRAIN_KB.lacto, why: `Lactobacillus is low (${(byId.lacto || 0).toFixed(2)}%, below ${taxaById.lacto.healthyLo}%).` });
    if (div.shannon < 3.0)
      recs.push({ ...STRAIN_KB.diversity, why: `Your diversity (Shannon ${div.shannon.toFixed(2)}) is on the lower side of the healthy band.` });
    return recs;
  }

  /* ---- Orchestrator (async, with progress callbacks) ----------------- */
  async function run(fastqText, opts) {
    opts = opts || {};
    const onStage = opts.onStage || function () {};
    const onProgress = opts.onProgress || function () {};
    const reference = opts.reference || global.GGG_REFERENCE;
    const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

    onStage('parse', 'Reading FASTQ records');
    await sleep(180);
    const parsedReads = parseFastq(fastqText);

    onStage('qc', 'Quality control');
    await sleep(180);
    const filtered = filterReads(parsedReads, { minLength: Math.max(30, reference.k || 21) });
    const reads = filtered.reads;
    const quality = filtered.quality;

    onStage('index', 'Building reference k-mer index');
    await sleep(160);
    const index = buildIndex(reference);
    const minHits = Math.max(4, Math.round((reference.readLen || 150) * 0.04));

    onStage('classify', 'Classifying reads by k-mer signature');
    const byId = Object.create(null);
    const taxaById = Object.create(null);
    for (const t of reference.taxa) { byId[t.id] = 0; taxaById[t.id] = t; }
    let classified = 0;
    const total = reads.length;
    const BATCH = 400;
    for (let s = 0; s < total; s += BATCH) {
      const end = Math.min(total, s + BATCH);
      for (let r = s; r < end; r++) {
        const tid = classifyRead(reads[r].seq, index, minHits);
        if (tid) { byId[tid]++; classified++; }
      }
      onProgress({ done: end, total, classified });
      // yield to the event loop so the progress bar paints
      if (s % (BATCH * 2) === 0) await sleep(0);
    }

    onStage('profile', 'Estimating relative abundance');
    await sleep(160);

    // relative abundance (% of classified reads), named species + grouped Other
    const named = reference.taxa.filter((t) => t.named);
    const abundance = []; // {id, species, phylum, pct, healthyLo, healthyHi, concern, function, status}
    let otherCount = 0;
    for (const t of reference.taxa) {
      if (t.named) {
        const pct = classified ? (100 * byId[t.id]) / classified : 0;
        let st = 'ok';
        if (t.concern === 'low' && pct < t.healthyLo) st = 'low';
        if (t.concern === 'high' && pct > t.healthyHi) st = 'high';
        abundance.push({
          id: t.id, species: t.species, phylum: t.phylum, pct,
          healthyLo: t.healthyLo, healthyHi: t.healthyHi,
          concern: t.concern, function: t.function, status: st,
          reads: byId[t.id],
        });
      } else {
        otherCount += byId[t.id];
      }
    }
    const otherPct = classified ? (100 * otherCount) / classified : 0;
    abundance.sort((a, b) => b.pct - a.pct);

    // phylum composition (named + other, by reads)
    const phylum = {};
    for (const t of reference.taxa) {
      phylum[t.phylum] = (phylum[t.phylum] || 0) + (classified ? (100 * byId[t.id]) / classified : 0);
    }

    // F/B ratio + enterotype. Enterotype evidence is aggregated by genus across
    // every reference taxon and left unclassified when support is absent, sparse,
    // or balanced; a zero-evidence tie must never default to Bacteroides.
    const F = phylum.Firmicutes || 0;
    const B = phylum.Bacteroidetes || 0;
    const fbRatio = B > 0 ? F / B : 0;
    const enterotypeEvidence = inferEnterotype(byId, reference.taxa, classified);
    const enterotype = enterotypeEvidence.label;

    // diversity over ALL species (named + filler) by read counts
    const div = diversity(byId);

    onStage('recommend', 'Matching probiotic strains to your gut');
    await sleep(220);
    const byIdPct = {};
    for (const a of abundance) byIdPct[a.id] = a.pct;
    const recs = quality.qualityGatePassed ? recommend(byIdPct, taxaById, div, phylum) : [];
    const idx = scores(byIdPct, phylum, div, taxaById);

    onStage('done', 'Report ready');
    return {
      quality, reportEligible: quality.qualityGatePassed,
      index: { distinctKmers: index.distinctKmers, k: index.k, minHits },
      classified, unclassifiedPct: total ? (100 * (total - classified)) / total : 0,
      abundance, otherPct, phylum, fbRatio, enterotype, enterotypeEvidence, diversity: div,
      scores: idx, recommendations: recs,
    };
  }

  function inferEnterotype(countsById, taxa, classified) {
    let bacteroides = 0, prevotella = 0;
    for (const taxon of taxa || []) {
      const genus = String(taxon.genus || String(taxon.species || '').split(/\s+/)[0])
        .replace(/[^A-Za-z]/g, '').toLowerCase();
      if (genus === 'bacteroides') bacteroides += countsById[taxon.id] || 0;
      if (genus === 'prevotella') prevotella += countsById[taxon.id] || 0;
    }
    const supportReads = bacteroides + prevotella;
    const minimumSupportReads = Math.max(10, Math.ceil((classified || 0) * 0.02));
    const dominantShare = supportReads ? Math.max(bacteroides, prevotella) / supportReads : 0;
    const evidence = { bacteroides, prevotella, supportReads, minimumSupportReads, dominantShare };
    if (supportReads < minimumSupportReads) {
      return { label: 'Unclassified', reason: 'insufficient genus-level evidence', ...evidence };
    }
    if (dominantShare < 0.65) {
      return { label: 'Unclassified', reason: 'Bacteroides and Prevotella evidence is too balanced', ...evidence };
    }
    return {
      label: bacteroides > prevotella ? 'Bacteroides-type (Type 1)' : 'Prevotella-type (Type 2)',
      reason: 'supported by genus-level read evidence',
      ...evidence,
    };
  }

  global.MetaScope = {
    run, parseFastq, qc, filterReads, buildIndex, classifyRead, diversity,
    recommend, inferEnterotype, STRAIN_KB,
  };
})(window);

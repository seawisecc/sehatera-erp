-- ============================================================
-- 0027  Isi ICD-10 bagian 2 dari 3 (M51.9 sampai V11.3)
-- ============================================================
--
-- 6820 kode, dari berkas e-klaim Kemenkes versi ICD10_2010.
--
-- Dipecah bertiga bukan karena rapi, tapi karena satu tempelan 1 MB membuat
-- SQL Editor Supabase tersendat, dan jalur menjalankan SQL di project ini
-- memang lewat sana. Potongannya rata menurut ukuran, bukan menurut bab:
-- bab ICD-10 timpang jauh (bab cedera sendiri hampir seperempat berkas),
-- jadi memotong di batas bab menghasilkan satu bagian yang tetap kebesaran.
-- Urutan kodenya tetap menaik, jadi bagian mana pun masih bisa ditelusuri.
--
-- Isinya dibungkus satu dollar-quote supaya seluruhnya jadi SATU pernyataan
-- dan satu string, bukan 6820 tuple VALUES yang harus diurai satu per satu.
-- Tidak ada tanda kutip yang perlu dilarikan, jadi nama seperti
-- "Crohn's disease" masuk apa adanya. Pemisahnya "|", dan sudah diperiksa:
-- tidak ada satu pun nama di kedua berkas Kemenkes yang memuat "|".
--
-- Bisa dijalankan ulang: `on conflict do update`, jadi menempelkannya dua
-- kali tidak menggandakan apa pun dan tidak mengeluh.

insert into public.icd10 (kode, nama)
select split_part(x, '|', 1), split_part(x, '|', 2)
from unnest(string_to_array($ICD$M51.9|Intervertebral disc disorder, unspecified
M53|Other dorsopathies, not elsewhere classified
M53.0|Cervicocranial syndrome
M53.00|Cervicocranial syndrome, multiple sites
M53.01|Cervicocranial syndrome, occipito-atlanto-axial region
M53.02|Cervicocranial syndrome, cervical region
M53.03|Cervicocranial syndrome, cervicothoracic region
M53.04|Cervicocranial syndrome, thoracic region
M53.05|Cervicocranial syndrome, thoracolumbar region
M53.06|Cervicocranial syndrome, lumbar region
M53.07|Cervicocranial syndrome, lumbosacral region
M53.08|Cervicocranial syndrome, sacral and sacrococcygeal region
M53.09|Cervicocranial syndrome, site unspecified
M53.1|Cervicobrachial syndrome
M53.10|Cervicobrachial syndrome, multiple sites
M53.11|Cervicobrachial syndrome, occipito-atlanto-axial region
M53.12|Cervicobrachial syndrome, cervical region
M53.13|Cervicobrachial syndrome, cervicothoracic region
M53.14|Cervicobrachial syndrome, thoracic region
M53.15|Cervicobrachial syndrome, thoracolumbar region
M53.16|Cervicobrachial syndrome, lumbar region
M53.17|Cervicobrachial syndrome, lumbosacral region
M53.18|Cervicobrachial syndrome, sacral and sacrococcygeal region
M53.19|Cervicobrachial syndrome, site unspecified
M53.2|Spinal instabilities
M53.20|Spinal instabilities, multiple sites
M53.21|Spinal instabilities, occipito-atlanto-axial region
M53.22|Spinal instabilities, cervical region
M53.23|Spinal instabilities, cervicothoracic region
M53.24|Spinal instabilities, thoracic region
M53.25|Spinal instabilities, thoracolumbar region
M53.26|Spinal instabilities, lumbar region
M53.27|Spinal instabilities, lumbosacral region
M53.28|Spinal instabilities, sacral and sacrococcygeal region
M53.29|Spinal instabilities, site unspecified
M53.3|Sacrococcygeal disorders, not elsewhere classified
M53.30|Sacrococcygeal disorders, not elsewhere classified, multiple sites
M53.31|Sacrococcygeal disorders, not elsewhere classified, occipito-atlanto-axial region
M53.32|Sacrococcygeal disorders, not elsewhere classified, cervical region
M53.33|Sacrococcygeal disorders, not elsewhere classified, cervicothoracic region
M53.34|Sacrococcygeal disorders, not elsewhere classified, thoracic region
M53.35|Sacrococcygeal disorders, not elsewhere classified, thoracolumbar region
M53.36|Sacrococcygeal disorders, not elsewhere classified, lumbosacral region
M53.37|Sacrococcygeal disorders, not elsewhere classified, sacral and sacrococcygeal region
M53.38|Sacrococcygeal disorders, not elsewhere classified, sacral and sacrococcygeal region
M53.39|Sacrococcygeal disorders, not elsewhere classified, site unspecified
M53.8|Other specified dorsopathies
M53.80|Other specified dorsopathies, multiple sites
M53.81|Other specified dorsopathies, occipito-atlanto-axial region
M53.82|Other specified dorsopathies, cervical region
M53.83|Other specified dorsopathies, cervicothoracic region
M53.84|Other specified dorsopathies, thoracic region
M53.85|Other specified dorsopathies, thoracolumbar region
M53.86|Other specified dorsopathies, lumbar region
M53.87|Other specified dorsopathies, lumbosacral region
M53.88|Other specified dorsopathies, sacral and sacrococcygeal region
M53.89|Other specified dorsopathies, site unspecified
M53.9|Dorsopathy, unspecified
M53.90|Dorsopathy, unspecified, multiple sites
M53.91|Dorsopathy, unspecified, occipito-atlanto-axial region
M53.92|Dorsopathy, unspecified, cervical region
M53.93|Dorsopathy, unspecified, cervicothoracic region
M53.94|Dorsopathy, unspecified, thoracic region
M53.95|Dorsopathy, unspecified, thoracolumbar region
M53.96|Dorsopathy, unspecified, lumbar region
M53.97|Dorsopathy, unspecified, lumbosacral region
M53.98|Dorsopathy, unspecified, sacral and sacrococcygeal region
M53.99|Dorsopathy, unspecified, site unspecified
M54|Dorsalgia
M54.0|Panniculitis affecting regions of neck and back
M54.00|Panniculitis affecting regions of neck and back, multiple sites
M54.01|Panniculitis affecting regions of neck and back, occipito-atlanto-axial region
M54.02|Panniculitis affecting regions of neck and back, cervical region
M54.03|Panniculitis affecting regions of neck and back, cervicothoracic region
M54.04|Panniculitis affecting regions of neck and back, thoracic region
M54.05|Panniculitis affecting regions of neck and back, thoracolumbar region
M54.06|Panniculitis affecting regions of neck and back, lumbar region
M54.07|Panniculitis affecting regions of neck and back, lumbosacral region
M54.08|Panniculitis affecting regions of neck and back, sacral and sacrococcygeal region
M54.09|Panniculitis affecting regions of neck and back, site unspecified
M54.1|Radiculopathy
M54.10|Radiculopathy, multiple sites
M54.11|Radiculopathy, occipito-atlanto-axial region
M54.12|Radiculopathy, cervical region
M54.13|Radiculopathy, cervicothoracic region
M54.14|Radiculopathy, thoracic region
M54.15|Radiculopathy, thoracolumbar region
M54.16|Radiculopathy, lumbar region
M54.17|Radiculopathy, lumbosacral region
M54.18|Radiculopathy, sacral and sacrococcygeal region
M54.19|Radiculopathy, site unspecified
M54.2|Cervicalgia
M54.20|Cervicalgia, multiple sites
M54.21|Cervicalgia, occipito-atlanto-axial region
M54.22|Cervicalgia, cervical region
M54.23|Cervicalgia, cervicothoracic region
M54.24|Cervicalgia, thoracic region
M54.25|Cervicalgia, thoracolumbar region
M54.26|Cervicalgia, lumbar region
M54.27|Cervicalgia, lumbosacral region
M54.28|Cervicalgia, sacral and sacrococcygeal region
M54.29|Cervicalgia, site unspecified
M54.3|Sciatica
M54.30|Sciatica, multiple sites
M54.31|Sciatica, occipito-atlanto-axial region
M54.32|Sciatica, cervical region
M54.33|Sciatica, cervicothoracic region
M54.34|Sciatica, thoracic region
M54.35|Sciatica, thoracolumbar region
M54.36|Sciatica, lumbar region
M54.37|Sciatica, lumbosacral region
M54.38|Sciatica, sacral and sacrococcygeal region
M54.39|Sciatica, site unspecified
M54.4|Lumbago with sciatica
M54.40|Lumbago with sciatica, multiple sites
M54.41|Lumbago with sciatica, occipito-atlanto-axial region
M54.42|Lumbago with sciatica, cervical region
M54.43|Lumbago with sciatica, cervicothoracic region
M54.44|Lumbago with sciatica, thoracic region
M54.45|Lumbago with sciatica, thoracolumbar region
M54.46|Lumbago with sciatica, lumbar region
M54.47|Lumbago with sciatica, lumbosacral region
M54.48|Lumbago with sciatica, sacral and sacrococcygeal region
M54.49|Lumbago with sciatica, site unspecified
M54.5|Low back pain
M54.50|Low back pain, multiple sites
M54.51|Low back pain, occipito-atlanto-axial region
M54.52|Low back pain, cervical region
M54.53|Low back pain, cervicothoracic region
M54.54|Low back pain, thoracic region
M54.55|Low back pain, thoracolumbar region
M54.56|Low back pain, lumbar region
M54.57|Low back pain, lumbosacral region
M54.58|Low back pain, sacral and sacrococcygeal region
M54.59|Low back pain, site unspecified
M54.6|Pain in thoracic spine
M54.60|Pain in thoracic spine, multiple sites
M54.61|Pain in thoracic spine, occipito-atlanto-axial region
M54.62|Pain in thoracic spine, cervical region
M54.63|Pain in thoracic spine, cervicothoracic region
M54.64|Pain in thoracic spine, thoracic region
M54.65|Pain in thoracic spine, thoracolumbar region
M54.66|Pain in thoracic spine, lumbar region
M54.67|Pain in thoracic spine, lumbosacral region
M54.68|Pain in thoracic spine, sacral and sacrococcygeal region
M54.69|Pain in thoracic spine, site unspecified
M54.8|Other dorsalgia
M54.80|Other dorsalgia, multiple sites
M54.81|Other dorsalgia, occipito-atlanto-axial region
M54.82|Other dorsalgia, cervical region
M54.83|Other dorsalgia, cervicothoracic region
M54.84|Other dorsalgia, thoracic region
M54.85|Other dorsalgia, thoracolumbar region
M54.86|Other dorsalgia, lumbar region
M54.87|Other dorsalgia, lumbosacral region
M54.88|Other dorsalgia, sacral and sacrococcygeal region
M54.89|Other dorsalgia, site unspecified
M54.9|Dorsalgia, unspecified
M54.90|Dorsalgia, unspecified, multiple sites
M54.91|Dorsalgia, unspecified, occipito-atlanto-axial region
M54.92|Dorsalgia, unspecified, cervical region
M54.93|Dorsalgia, unspecified, cervicothoracic region
M54.94|Dorsalgia, unspecified, thoracic region
M54.95|Dorsalgia, unspecified, thoracolumbar region
M54.96|Dorsalgia, unspecified, lumbar region
M54.97|Dorsalgia, unspecified, lumbosacral region
M54.98|Dorsalgia, unspecified, sacral and sacrococcygeal region
M54.99|Dorsalgia, unspecified, site unspecified
M60|Myositis
M60.0|Infective myositis
M60.00|Infective myositis, mulitple sites
M60.01|Infective myositis, shoulder
M60.02|Infective myositis, upper arm
M60.03|Infective myositis, forearm
M60.04|Infective myositis, hand
M60.05|Infective myositis, pelvic region and thigh
M60.06|Infective myositis, lower leg
M60.07|Infective myositis, ankle and foot
M60.08|Infective myositis, other
M60.09|Infective myositis,  site unspecified
M60.1|Interstitial myositis
M60.10|Interstitial myositis, mulitple sites
M60.11|Interstitial myositis, shoulder
M60.12|Interstitial myositis, upper arm
M60.13|Interstitial myositis, forearm
M60.14|Interstitial myositis, hand
M60.15|Interstitial myositis, pelvic region and thigh
M60.16|Interstitial myositis, lower leg
M60.17|Interstitial myositis, ankle and foot
M60.18|Interstitial myositis, other
M60.19|Interstitial myositis, site unspecified
M60.2|Foreign body granuloma of soft tissue, not elsewhere classified
M60.20|Foreign body graniloma of soft tissue, mulitple sites
M60.21|Foreign body graniloma of soft tissue, shoulder
M60.22|Foreign body graniloma of soft tissue, upper arm
M60.23|Foreign body graniloma of soft tissue, forearm
M60.24|Foreign body graniloma of soft tissue, hand
M60.25|Foreign body granuloma of soft tissue, pelvic region and thigh
M60.26|Foreign body graniloma of soft tissue, lower leg
M60.27|Foreign body graniloma of soft tissue, ankle and foot
M60.28|Foreign body granuloma of soft tissue, other
M60.29|Foreign body granuloma of soft tissue, site unspecified
M60.8|Other myositis
M60.80|Other myositis, mulitple sites
M60.81|Other myositis, shoulder
M60.82|Other myositis, upper arm
M60.83|Other myositis, forearm
M60.84|Other myositis, hand
M60.85|Other myositis, pelvic region and thigh
M60.86|Other myositis, lower leg
M60.87|Other myositis, ankle and foot
M60.88|Other myositis, other
M60.89|Other myositis,  site unspecified
M60.9|Myositis, unspecified
M60.90|Myositis unspecified, mulitple sites
M60.91|Myositis unspecified, shoulder
M60.92|Myositis unspecified, upper arm
M60.93|Myositis unspecified, forearm
M60.94|Myositis unspecified, hand
M60.95|Myositis unspecified, pelvic region and thigh
M60.96|Myositis unspecified, lower leg
M60.97|Myositis unspecified, ankle and foot
M60.98|Myositis unspecified, other
M60.99|Myositis unspecified, site unspecified
M61|Calcification and ossification of muscle
M61.0|Myositis ossificans traumatica
M61.00|Myositis ossificans traumatica, mulitple sites
M61.01|Myositis ossificans traumatica, shoulder
M61.02|Myositis ossificans traumatica, upper arm
M61.03|Myositis ossificans traumatica, forearm
M61.04|Myositis ossificans traumatica, hand
M61.05|Myositis ossificans traumatica, pelvic region and thigh
M61.06|Myositis ossificans traumatica, lower leg
M61.07|Myositis ossificans traumatica, ankle and foot
M61.08|Myositis ossificans traumatica, other
M61.09|Myositis ossificans traumatica, site unspecified
M61.1|Myositis ossificans progressiva
M61.10|Myositis ossificans progressiva, mulitple sites
M61.11|Myositis ossificans progressiva, shoulder
M61.12|Myositis ossificans progressiva, upper arm
M61.13|Myositis ossificans progressiva, forearm
M61.14|Myositis ossificans progressiva, hand
M61.15|Myositis ossificans progressiva, pelvic region and thigh
M61.16|Myositis ossificans progressiva, lower leg
M61.17|Myositis ossificans progressiva, ankle and foot
M61.18|Myositis ossificans progressiva, other
M61.19|Myositis ossificans progressiva, site unspecified
M61.2|Paralytic calcification and ossification of muscle
M61.20|Paralytic calcification and ossifcation of muscle, mulitple sites
M61.21|Paralytic calcification and ossifcation of muscle, shoulder
M61.22|Paralytic calcification and ossifcation of muscle, upper arm
M61.23|Paralytic calcification and ossifcation of muscle, forearm
M61.24|Paralytic calcification and ossifcation of muscle, hand
M61.25|Paralytic calcification and ossifcation of muscle, pelvic region and thigh
M61.26|Paralytic calcification and ossifcation of muscle, lower leg
M61.27|Paralytic calcification and ossifcation of muscle, ankle and foot
M61.28|Paralytic calcification and ossifcation of muscle, other
M61.29|Paralytic calcification and ossifcation of muscle, site unspecified
M61.3|Calcification and ossification of muscles assoc with burns
M61.30|Calcification and ossification of muscles assco with burns, multiple sites
M61.31|Calcification and ossification of muscles assco with burns, shoulder
M61.32|Calcification and ossification of muscles assco with burns, upper arm
M61.33|Calcification and ossification of muscles assco with burns, forearm
M61.34|Calcification and ossification of muscles assco with burns, hand
M61.35|Calcification and ossification of muscles assco with burns, pelvic region and thigh
M61.36|Calcification and ossification of muscles assco with burns, lower leg
M61.37|Calcification and ossification of muscles assco with burns, ankle and foot
M61.38|Calcification and ossification of muscles assco with burns, other
M61.39|Calcification and ossification of muscles assco with burns, site unspecified
M61.4|Other calcification of muscle
M61.40|Other calcification of muscle, multiple sites
M61.41|Other calcification of muscle, shoulder
M61.42|Other calcification of muscle, upper arm
M61.43|Other calcification of muscle, forearm
M61.44|Other calcification of muscle, hand
M61.45|Other calcification of muscle, pelvic region and thigh
M61.46|Other calcification of muscle, lower leg
M61.47|Other calcification of muscle, ankle and foot
M61.48|Other calcification of muscle, other
M61.49|Other calcification of muscle, site unspecified
M61.5|Other ossification of muscle
M61.50|Other ossification of muscle, multiple sites
M61.51|Other ossification of muscle, shoulder
M61.52|Other ossification of muscle, upper arm
M61.53|Other ossification of muscle, forearm
M61.54|Other ossification of muscle, hand
M61.55|Other ossification of muscle, pelvic region and thigh
M61.56|Other ossification of muscle, lower leg
M61.57|Other ossification of muscle, ankle and foot
M61.58|Other ossification of muscle, other
M61.59|Other ossification of muscle, site unspecified
M61.9|Calcification and ossification of muscle, unspecified
M61.90|Calcification and ossification of muscle unspecified, multiple sites
M61.91|Calcification and ossification of muscle unspecified, shoulder
M61.92|Calcification and ossification of muscle unspecified, upper arm
M61.93|Calcification and ossification of muscle unspecified, forearm
M61.94|Calcification and ossification of muscle unspecified, hand
M61.95|Calcification and ossification of muscle unspecified, pelvic region and thigh
M61.96|Calcification and ossification of muscle unspecified, lower leg
M61.97|Calcification and ossification of muscle unspecified, ankle and foot
M61.98|Calcification and ossification of muscle unspecified, other
M61.99|Calcification and ossification of muscle unspecified, site unspecified
M62|Other disorders of muscle
M62.0|Diastasis of muscle
M62.00|Diastasis of muscle, mulitple sites
M62.01|Diastasis of muscle, shoulder
M62.02|Diastasis of muscle, upper arm
M62.03|Diastasis of muscle, forearm
M62.04|Diastasis of muscle, hand
M62.05|Diastasis of muscle, pelvic region and thigh
M62.06|Diastasis of muscle, lower leg
M62.07|Diastasis of muscle, ankle and foot
M62.08|Diastasis of muscle, other
M62.09|Diastasis of muscle, site unspecified
M62.1|Other rupture of muscle (nontraumatic)
M62.10|Other rupture of muscle (nontraumatic), multiple sites
M62.11|Other rupture of muscle (nontraumatic), shoulder
M62.12|Other rupture of muscle (nontraumatic), upper arm
M62.13|Other rupture of muscle (nontraumatic), forearm
M62.14|Other rupture of muscle (nontraumatic), hand
M62.15|Other rupture of muscle (nontraumatic), pelvic region and thigh
M62.16|Other rupture of muscle (nontraumatic), lower leg
M62.17|Other rupture of muscle (nontraumatic), ankle and foot
M62.18|Other rupture of muscle (nontraumatic), other
M62.19|Other rupture of muscle (nontraumatic), site unspecified
M62.2|Ischaemic infarction of muscle
M62.20|Ischaemic infarction of muscle, multiple sites
M62.21|Ischaemic infarction of muscle, shoulder
M62.22|Ischaemic infarction of muscle, upper arm
M62.23|Ischaemic infarction of muscle, forearm
M62.24|Ischaemic infarction of muscle, hand
M62.25|Ischaemic infarction of muscle, pelvic region and thigh
M62.26|Ischaemic infarction of muscle, lower leg
M62.27|Ischaemic infarction of muscle, ankle and foot
M62.28|Ischaemic infarction of muscle, other
M62.29|Ischaemic infarction of muscle, site unspecified
M62.3|Immobility syndrome (paraplegic)
M62.30|Immobility syndrome (paraplegic), multiple sites
M62.31|Immobility syndrome (paraplegic), shoulder
M62.32|Immobility syndrome (paraplegic), upper arm
M62.33|Immobility syndrome (paraplegic), forearm
M62.34|Immobility syndrome (paraplegic), hand
M62.35|Immobility syndrome (paraplegic), pelvic region and thigh
M62.36|Immobility syndrome (paraplegic), lower leg
M62.37|Immobility syndrome (paraplegic), ankle and foot
M62.38|Immobility syndrome (paraplegic), other
M62.39|Immobility syndrome (paraplegic), site unspecified
M62.4|Contracture of muscle
M62.40|Contracture of muscle, multiple sites
M62.41|Contracture of muscle, shoulder
M62.42|Contracture of muscle, upper arm
M62.43|Contracture of muscle, forearm
M62.44|Contracture of muscle, hand
M62.45|Contracture of muscle, pelvic region and thigh
M62.46|Contracture of muscle, lower leg
M62.47|Contracture of muscle, ankle and foot
M62.48|Contracture of muscle, other
M62.49|Contracture of muscle, site unspecified
M62.5|Muscle wasting and atrophy, not elsewhere classified
M62.50|Muscle wasting and atrophy, multiple sites
M62.51|Muscle wasting and atrophy, shoulder
M62.52|Muscle wasting and atrophy, upper arm
M62.53|Muscle wasting and atrophy, forearm
M62.54|Muscle wasting and atrophy, hand
M62.55|Muscle wasting and atrophy, pelvic region and thigh
M62.56|Muscle wasting and atrophy, lower leg
M62.57|Muscle wasting and atrophy, ankle and foot
M62.58|Muscle wasting and atrophy, other
M62.59|Muscle wasting and atrophy, site unspecified
M62.6|Muscle strain
M62.60|Muscle strain, multiple sites
M62.61|Muscle strain, shoulder
M62.62|Muscle strain, upper arm
M62.63|Muscle strain, forearm
M62.64|Muscle strain, hand
M62.65|Muscle strain, pelvic region and thigh
M62.66|Muscle strain, lower leg
M62.67|Muscle strain, ankle and foot
M62.68|Muscle strain, other
M62.69|Muscle strain, site unspecified
M62.8|Other specified disorders of muscle
M62.80|Other specified disorders of muscle, multiple sites
M62.81|Other specified disorders of muscle, shoulder
M62.82|Other specified disorders of muscle, upper arm
M62.83|Other specified disorders of muscle, forearm
M62.84|Other specified disorders of muscle, hand
M62.85|Other specified disorders of muscle, pelvic region and thigh
M62.86|Other specified disorders of muscle, lower leg
M62.87|Other specified disorders of muscle, ankle and foot
M62.88|Other specified disorders of muscle, other
M62.89|Other specified disorders of muscle, site unspecified
M62.9|Disorder of muscle, unspecified
M62.90|Disorder of muscle, unspecified, multiple sites
M62.91|Disorder of muscle, unspecified, shoulder
M62.92|Disorder of muscle, unspecified, upper arm
M62.93|Disorder of muscle, unspecified, forearm
M62.94|Disorder of muscle, unspecified, hand
M62.95|Disorder of muscle, unspecified, pelvic region and thigh
M62.96|Disorder of muscle, unspecified, lower leg
M62.97|Disorder of muscle, unspecified, ankle and foot
M62.98|Disorder of muscle, unspecified, other
M62.99|Disorder of muscle, unspecified, site unspecified
M63|Disorders of muscle in diseases classified elsewhere
M63.0|Myositis in bacterial diseases classified elsewhere
M63.1|Myositis in protozoal and parasitic infections classified elsewhere
M63.2|Myositis in other infectious diseases classified elsewhere
M63.3|Myositis in sarcoidosis
M63.8|Other disorders of muscle in diseases classified elsewhere
M65|Synovitis and tenosynovitis
M65.0|Abscess of tendon sheath
M65.00|Abscess of tendon sheath, multiple sites
M65.01|Abscess of tendon sheath, shoulder region
M65.02|Abscess of tendon sheath, upper arm
M65.03|Abscess of tendon sheath, forearm
M65.04|Abscess of tendon sheath, hand
M65.05|Abscess of tendon sheath, pelvic and thigh
M65.06|Abscess of tendon sheath, lower leg
M65.07|Abscess of tendon sheath, ankle and foot
M65.08|Abscess of tendon sheath, other
M65.09|Abscess of tendon sheath, site unspecified
M65.1|Other infective (teno)synovitis
M65.10|Other infective (teno)synovitis, multiple sites
M65.11|Other infective (teno)synovitis, shoulder region
M65.12|Other infective (teno)synovitis, upper arm
M65.13|Other infective (teno)synovitis, forearm
M65.14|Other infective (teno)synovitis, hand
M65.15|Other infective (teno)synovitis, pelvic and thigh
M65.16|Other infective (teno)synovitis, lower leg
M65.17|Other infective (teno)synovitis, ankle and foot
M65.18|Other infective (teno)synovitis, other
M65.19|Other infective (teno)synovitis, site unspecified
M65.2|Calcific tendinitis
M65.20|Calcific tendinitis, multiple sites
M65.21|Calcific tendinitis, shoulder region
M65.22|Calcific tendinitis, upper arm
M65.23|Calcific tendinitis, forearm
M65.24|Calcific tendinitis, hand
M65.25|Calcific tendinitis, pelvic region and thigh
M65.26|Calcific tendinitis, lower leg
M65.27|Calcific tendinitis, ankle and foot
M65.28|Calcific tendinitis, other
M65.29|Calcific tendinitis, site unspecified
M65.3|Trigger finger
M65.30|Trigger finger, multiple sites
M65.31|Trigger finger, shoulder region
M65.32|Trigger finger, upper arm
M65.33|Trigger finger, forearm
M65.34|Trigger finger, hand
M65.35|Trigger finger, pelvic region and thigh
M65.36|Trigger finger, lower leg
M65.37|Trigger finger, ankle and foot
M65.38|Trigger finger, other
M65.39|Trigger finger, site unspecified
M65.4|Radial styloid tenosynovitis [de quervain]
M65.40|Radial styloid tenosynovitis [de quervain], multiple sites
M65.41|Radial styloid tenosynovitis [de quervain], shoulder region
M65.42|Radial styloid tenosynovitis [de quervain], upper arm
M65.43|Radial styloid tenosynovitis [de quervain], forearm
M65.44|Radial styloid tenosynovitis [de quervain], hand
M65.45|Radial styloid tenosynovitis [de quervain], pelvic region and thigh
M65.46|Radial styloid tenosynovitis [de quervain], lower leg
M65.47|Radial styloid tenosynovitis [de quervain], ankle and foot
M65.48|Radial styloid tenosynovitis [de quervain], other
M65.49|Radial styloid tenosynovitis [de quervain], site unspecified
M65.8|Other synovitis and tenosynovitis
M65.80|Other synovitis and tenosynovitis, multiple sites
M65.81|Other synovitis and tenosynovitis, shoulder region
M65.82|Other synovitis and tenosynovitis, upper arm
M65.83|Other synovitis and tenosynovitis, forearm
M65.84|Other synovitis and tenosynovitis, hand
M65.85|Other synovitis and tenosynovitis, pelvic region and thigh
M65.86|Other synovitis and tenosynovitis, lower leg
M65.87|Other synovitis and tenosynovitis, ankle and foot
M65.88|Other synovitis and tenosynovitis, other
M65.89|Other synovitis and tenosynovitis, site unspecified
M65.9|Synovitis and tenosynovitis, unspecified
M65.90|Synovitis and tenosynovitis, unspecified, multiple sites
M65.91|Synovitis and tenosynovitis, unspecified, shoulder region
M65.92|Synovitis and tenosynovitis, unspecified, upper arm
M65.93|Synovitis and tenosynovitis, unspecified, forearm
M65.94|Synovitis and tenosynovitis, unspecified, hand
M65.95|Synovitis and tenosynovitis, unspecified, pelvic region and thigh
M65.96|Synovitis and tenosynovitis, unspecified, lower leg
M65.97|Synovitis and tenosynovitis, unspecified, ankle and foot
M65.98|Synovitis and tenosynovitis, unspecified, other
M65.99|Synovitis and tenosynovitis, unspecified, site unspecified
M66|Spontaneous rupture of synovium and tendon
M66.0|Rupture of popliteal cyst
M66.00|Rupture of popliteal cyst, multiple sites
M66.01|Rupture of popliteal cyst, shoulder region
M66.02|Rupture of popliteal cyst, upper arm
M66.03|Rupture of popliteal cyst, forearm
M66.04|Rupture of popliteal cyst, hand
M66.05|Rupture of popliteal cyst, pelvic region and thigh
M66.06|Rupture of popliteal cyst, lower leg
M66.07|Rupture of popliteal cyst, ankle and foot
M66.08|Rupture of popliteal cyst, other
M66.09|Rupture of popliteal cyst, site unspecified
M66.1|Rupture of synovium
M66.10|Rupture of synovium, multiple sites
M66.11|Rupture of synovium, shoulder region
M66.12|Rupture of synovium, upper arm
M66.13|Rupture of synovium, forearm
M66.14|Rupture of synovium, hand
M66.15|Rupture of synovium, pelvic region and thigh
M66.16|Rupture of synovium, lower leg
M66.17|Rupture of synovium, ankle and foot
M66.18|Rupture of synovium, other
M66.19|Rupture of synovium, site unspecified
M66.2|Spontaneous rupture of extensor tendons
M66.20|Spontaneous rupture of extensor tendons, multiple sites
M66.21|Spontaneous rupture of extensor tendons, shoulder region
M66.22|Spontaneous rupture of extensor tendons, upper arm
M66.23|Spontaneous rupture of extensor tendons, forearm
M66.24|Spontaneous rupture of extensor tendons, hand
M66.25|Spontaneous rupture of extensor tendons, pelvic region and thigh
M66.26|Spontaneous rupture of extensor tendons, lower leg
M66.27|Spontaneous rupture of extensor tendons, ankle and foot
M66.28|Spontaneous rupture of extensor tendons, other
M66.29|Spontaneous rupture of extensor tendons, site unspecified
M66.3|Spontaneous rupture of flexor tendons
M66.30|Spontaneous rupture of flexor tendons, multiple sites
M66.31|Spontaneous rupture of flexor tendons, shoulder region
M66.32|Spontaneous rupture of flexor tendons, upper arm
M66.33|Spontaneous rupture of flexor tendons, forearm
M66.34|Spontaneous rupture of flexor tendons, hand
M66.35|Spontaneous rupture of flexor tendons, pelvic region and thigh
M66.36|Spontaneous rupture of flexor tendons, lower leg
M66.37|Spontaneous rupture of flexor tendons, ankle and foot
M66.38|Spontaneous rupture of flexor tendons, other
M66.39|Spontaneous rupture of flexor tendons, site unspecified
M66.4|Spontaneous rupture of other tendons
M66.40|Spontaneous rupture of other tendons, multiple sites
M66.41|Spontaneous rupture of other tendons, shoulder region
M66.42|Spontaneous rupture of other tendons, upper arm
M66.43|Spontaneous rupture of other tendons, forearm
M66.44|Spontaneous rupture of other tendons, hand
M66.45|Spontaneous rupture of other tendons, pelvic region and thigh
M66.46|Spontaneous rupture of other tendons, lower leg
M66.47|Spontaneous rupture of other tendons, ankle and foot
M66.48|Spontaneous rupture of other tendons, other
M66.49|Spontaneous rupture of other tendons, site unspecified
M66.5|Spontaneous rupture of unspecified tendon
M66.50|Spontaneous rupture of unspecified tendon, multiple sites
M66.51|Spontaneous rupture of unspecified tendon, shoulder region
M66.52|Spontaneous rupture of unspecified tendon, upper arm
M66.53|Spontaneous rupture of unspecified tendon, forearm
M66.54|Spontaneous rupture of unspecified tendon, hand
M66.55|Spontaneous rupture of unspecified tendon, pelvic region and thigh
M66.56|Spontaneous rupture of unspecified tendon, lower leg
M66.57|Spontaneous rupture of unspecified tendon, ankle and foot
M66.58|Spontaneous rupture of unspecified tendon, other
M66.59|Spontaneous rupture of unspecified tendon, site unspecified
M67|Other disorders of synovium and tendon
M67.0|Short achilles tendon (acquired)
M67.1|Other contracture of tendon (sheath)
M67.2|Synovial hypertrophy, not elsewhere classified
M67.3|Transient synovitis
M67.4|Ganglion
M67.8|Other specified disorders of synovium and tendon
M67.9|Disorder of synovium and tendon, unspecified
M68|Disorders of synovium and tendon in diseases classified elsewhere
M68.0|Synovitis and tenosynovitis in bacterial diseases classified elsewhere
M68.8|Other disorders of synovium and tendon in diseases classified elsewhere
M70|Soft tissue disorders related to use, overuse and pressure
M70.0|Chronic crepitant synovitis of hand and wrist
M70.00|Chronic crepitant synovitis of hand and wrist, multiple sites
M70.01|Chronic crepitant synovitis of hand and wrist, shoulder region
M70.02|Chronic crepitant synovitis of hand and wrist, upper arm
M70.03|Chronic crepitant synovitis of hand and wrist, forearm
M70.04|Chronic crepitant synovitis of hand and wrist, hand
M70.05|Chronic crepitant synovitis of hand and wrist, pelvic region and thigh
M70.06|Chronic crepitant synovitis of hand and wrist, lower leg
M70.07|Chronic crepitant synovitis of hand and wrist, ankle and foot
M70.08|Chronic crepitant synovitis of hand and wrist, other
M70.09|Chronic crepitant synovitis of hand and wrist, site unspecified
M70.1|Bursitis of hand
M70.10|Bursitis of hand, multiple sites
M70.11|Bursitis of hand, shoulder region
M70.12|Bursitis of hand, upper arm
M70.13|Bursitis of hand, forearm
M70.14|Bursitis of hand, hand
M70.15|Bursitis of hand, pelvic region and thigh
M70.16|Bursitis of hand, lower leg
M70.17|Bursitis of hand, ankle and foot
M70.18|Bursitis of hand, other
M70.19|Bursitis of hand, site unspecified
M70.2|Olecranon bursitis
M70.20|Olecranon bursitis, multiple sites
M70.21|Olecranon bursitis, shoulder region
M70.22|Olecranon bursitis, upper arm
M70.23|Olecranon bursitis, forearm
M70.24|Olecranon bursitis, hand
M70.25|Olecranon bursitis, pelvic region and thigh
M70.26|Olecranon bursitis, lower leg
M70.27|Olecranon bursitis, ankle and foot
M70.28|Olecranon bursitis, other
M70.29|Olecranon bursitis, site unspecified
M70.3|Other bursitis of elbow
M70.30|Other bursitis of elbow, multiple sites
M70.31|Other bursitis of elbow, shoulder region
M70.32|Other bursitis of elbow, upper arm
M70.33|Other bursitis of elbow, forearm
M70.34|Other bursitis of elbow, hand
M70.35|Other bursitis of elbow, pelvic region and thigh
M70.36|Other bursitis of elbow, lower leg
M70.37|Other bursitis of elbow, ankle and foot
M70.38|Other bursitis of elbow, other
M70.39|Other bursitis of elbow, site unspecified
M70.4|Prepatellar bursitis
M70.40|Prepatellar bursitis, multiple sites
M70.41|Prepatellar bursitis, shoulder region
M70.42|Prepatellar bursitis, upper arm
M70.43|Prepatellar bursitis, forearm
M70.44|Prepatellar bursitis,  hand
M70.45|Prepatellar bursitis, pelvic region and thigh
M70.46|Prepatellar bursitis, lower leg
M70.47|Prepatellar bursitis, ankle and foot
M70.48|Prepatellar bursitis, other
M70.49|Prepatellar bursitis, site unspecified
M70.5|Other bursitis of knee
M70.50|Other bursitis of knee, multiple sites
M70.51|Other bursitis of knee, shoulder region
M70.52|Other bursitis of knee, upper arm
M70.53|Other bursitis of knee, forearm
M70.54|Other bursitis of knee, hand
M70.55|Other bursitis of knee, pelvic region and thigh
M70.56|Other bursitis of knee, lower leg
M70.57|Other bursitis of knee, ankle and foot
M70.58|Other bursitis of knee, other
M70.59|Other bursitis of knee, site unspecified
M70.6|Trochanteric bursitis
M70.60|Trochanteric bursitis, multiple sites
M70.61|Trochanteric bursitis, shoulder region
M70.62|Trochanteric bursitis, upper arm
M70.63|Trochanteric bursitis, forearm
M70.64|Trochanteric bursitis, hand
M70.65|Trochanteric bursitis, pelvic region and thigh
M70.66|Trochanteric bursitis, lower leg
M70.67|Trochanteric bursitis, ankle and foot
M70.68|Trochanteric bursitis, other
M70.69|Trochanteric bursitis, site unspecified
M70.7|Other bursitis of hip
M70.70|Other bursitis of hip, multiple sites
M70.71|Other bursitis of hip, shoulder region
M70.72|Other bursitis of hip, upper arm
M70.73|Other bursitis of hip, forearm
M70.74|Other bursitis of hip, hand
M70.75|Other bursitis of hip, pelvic region and thigh
M70.76|Other bursitis of hip, lower leg
M70.77|Other bursitis of hip, ankle and foot
M70.78|Other bursitis of hip, other
M70.79|Other bursitis of hip, site unspecified
M70.8|Other soft tissue disorder related to use overuse and pressure
M70.80|Other soft tissue disorder related to use overuse and pressure, multiple sites
M70.81|Other soft tissue disorder related to use overuse and pressure, shoulder region
M70.82|Other soft tissue disorder related to use overuse and pressure, upper arm
M70.83|Other soft tissue disorder related to use overuse and pressure, forearm
M70.84|Other soft tissue disorder related to use overuse and pressure, hand
M70.85|Other soft tissue disorder related to use overuse and pressure, pelvic region and thigh
M70.86|Other soft tissue disorder related to use overuse and pressure, lower leg
M70.87|Other soft tissue disorder related to use overuse and pressure, ankle and foot
M70.88|Other soft tissue disorder related to use overuse and pressure, other
M70.89|Other soft tissue disorder related to use overuse and pressure, site unspecified
M70.9|Unspecified soft tissue disorder related to use overuse and pressure
M70.90|Unspecified soft tissue disorder related to use overuse and pressure, multiple sites
M70.91|Unspecified soft tissue disorder related to use overuse and pressure, shoulder region
M70.92|Unspecified soft tissue disorder related to use overuse and pressure, upper arm
M70.93|Unspecified soft tissue disorder related to use overuse and pressure, forearm
M70.94|Unspecified soft tissue disorder related to use overuse and pressure, hand
M70.95|Unspecified soft tissue disorder related to use overuse and pressure, pelvic region and thigh
M70.96|Unspecified soft tissue disorder related to use overuse and pressure, lower leg
M70.97|Unspecified soft tissue disorder related to use overuse and pressure, ankle and foot
M70.98|Unspecified soft tissue disorder related to use overuse and pressure, other
M70.99|Unspecified soft tissue disorder related to use overuse and pressure, site unspecified
M71|Other bursopathies
M71.0|Abscess of bursa
M71.00|Abscess of bursa, multiple sites
M71.01|Abscess of bursa, shoulder region
M71.02|Abscess of bursa, upper arm
M71.03|Abscess of bursa, forearm
M71.04|Abscess of bursa, hand
M71.05|Abscess of bursa, pelvic region and thigh
M71.06|Abscess of bursa, lower leg
M71.07|Abscess of bursa, ankle and foot
M71.08|Abscess of bursa, other
M71.09|Abscess of bursa, site unspecified
M71.1|Other infective bursitis
M71.10|Other infective bursitis, multiple sites
M71.11|Other infective bursitis, shoulder region
M71.12|Other infective bursitis, upper arm
M71.13|Other infective bursitis, forearm
M71.14|Other infective bursitis, hand
M71.15|Other infective bursitis, pelvic region and thigh
M71.16|Other infective bursitis, lower leg
M71.17|Other infective bursitis, ankle and foot
M71.18|Other infective bursitis, other
M71.19|Other infective bursitis, site unspecified
M71.2|Synovial cyst of popliteal space [baker]
M71.20|Synovial cyst of popliteal space [Baker], multiple sites
M71.21|Synovial cyst of popliteal space [Baker], shoulder region
M71.22|Synovial cyst of popliteal space [Baker], upper arm
M71.23|Synovial cyst of popliteal space [Baker], forearm
M71.24|Synovial cyst of popliteal space [Baker], hand
M71.25|Synovial cyst of popliteal space [Baker], pelvic region and thigh
M71.26|Synovial cyst of popliteal space [Baker], lower leg
M71.27|Synovial cyst of popliteal space [Baker], ankle and foot
M71.28|Synovial cyst of popliteal space [Baker], other
M71.29|Synovial cyst of popliteal space [Baker], site unspecified
M71.3|Other bursal cyst
M71.30|Other bursal cyst, multiple sites
M71.31|Other bursal cyst, shoulder region
M71.32|Other bursal cyst, upper arm
M71.33|Other bursal cyst, forearm
M71.34|Other bursal cyst, hand
M71.35|Other bursal cyst, pelvic region and thigh
M71.36|Other bursal cyst, lower leg
M71.37|Other bursal cyst, ankle and foot
M71.38|Other bursal cyst, other
M71.39|Other bursal cyst, site unspecified
M71.4|Calcium deposit in bursa
M71.40|Calcium deposit in bursa, multiple sites
M71.42|Calcium deposit in bursa, upper arm
M71.43|Calcium deposit in bursa, forearm
M71.44|Calcium deposit in bursa, hand
M71.45|Calcium deposit in bursa, pelvic region and thigh
M71.46|Calcium deposit in bursa, lower leg
M71.47|Calcium deposit in bursa, ankle and foot
M71.48|Calcium deposit in bursa, other
M71.49|Calcium deposit in bursa, site unspecified
M71.5|Other bursitis, not elsewhere classified
M71.50|Other bursitis, not elsewhere classified, multiple sites
M71.52|Other bursitis, not elsewhere classified, upper arm
M71.53|Other bursitis, not elsewhere classified, forearm
M71.54|Other bursitis, not elsewhere classified, hand
M71.55|Other bursitis, not elsewhere classified, pelvic region and thigh
M71.56|Other bursitis, not elsewhere classified, lower leg
M71.57|Other bursitis, not elsewhere classified, ankle and foot
M71.58|Other bursitis, not elsewhere classified, other
M71.59|Other bursitis, not elsewhere classified, site unspecified
M71.8|Other specified bursopathies
M71.80|Other specified bursopathies, multiple sites
M71.81|Other specified bursopathies, shoulder region
M71.82|Other specified bursopathies, upper arm
M71.83|Other specified bursopathies, forearm
M71.84|Other specified bursopathies, hand
M71.85|Other specified bursopathies, pelvic region and thigh
M71.86|Other specified bursopathies, lower leg
M71.87|Other specified bursopathies, ankle and foot
M71.88|Other specified bursopathies, other
M71.89|Other specified bursopathies, site unspecified
M71.9|Bursopathy, unspecified
M71.90|Bursopathy, unspecified, multiple sites
M71.91|Bursopathy, unspecified, shoulder region
M71.92|Bursopathy, unspecified, upper arm
M71.93|Bursopathy, unspecified, forearm
M71.94|Bursopathy, unspecified, hand
M71.95|Bursopathy, unspecified, pelvic region and thigh
M71.96|Bursopathy, unspecified, lower leg
M71.97|Bursopathy, unspecified, ankle and foot
M71.98|Bursopathy, unspecified, other
M71.99|Bursopathy, unspecified, site unspecified
M72|Fibroblastic disorders
M72.0|Palmar fascial fibromatosis [dupuytren]
M72.00|Palmar fascial fibromatosis [Dupuytren], multiple sites
M72.01|Palmar fascial fibromatosis [Dupuytren], shoulder region
M72.02|Palmar fascial fibromatosis [Dupuytren], upper arm
M72.03|Palmar fascial fibromatosis [Dupuytren], forearm
M72.04|Palmar fascial fibromatosis [Dupuytren], hand
M72.05|Palmar fascial fibromatosis [Dupuytren], pelvic region and thigh
M72.06|Palmar fascial fibromatosis [Dupuytren], lower leg
M72.07|Palmar fascial fibromatosis [Dupuytren], ankle and foot
M72.08|Palmar fascial fibromatosis [Dupuytren], other
M72.09|Palmar fascial fibromatosis [Dupuytren], site unspecified
M72.1|Knuckle pads
M72.10|Knuckle pads, multiple sites
M72.11|Knuckle pads, shoulder region
M72.12|Knuckle pads, upper arm
M72.13|Knuckle pads, forearm
M72.14|Knuckle pads, hand
M72.15|Knuckle pads, pelvic region and thigh
M72.16|Knuckle pads, lower leg
M72.17|Knuckle pads, ankle and foot
M72.18|Knuckle pads, other
M72.19|Knuckle pads, site unspecified
M72.2|Plantar fascial fibromatosis
M72.20|Plantar fascial fibromatosis, multiple sites
M72.21|Plantar fascial fibromatosis, shoulder region
M72.22|Plantar fascial fibromatosis, upper arm
M72.23|Plantar fascial fibromatosis, forearm
M72.24|Plantar fascial fibromatosis, hand
M72.25|Plantar fascial fibromatosis, pelvic region and thigh
M72.26|Plantar fascial fibromatosis, lower leg
M72.27|Plantar fascial fibromatosis, ankle and foot
M72.28|Plantar fascial fibromatosis, other
M72.29|Plantar fascial fibromatosis, site unspecified
M72.4|Pseudosarcomatous fibromatosis
M72.40|Pseudosarcomatous fibromatosis, multiple sites
M72.41|Pseudosarcomatous fibromatosis, shoulder region
M72.42|Pseudosarcomatous fibromatosis, upper arm
M72.43|Pseudosarcomatous fibromatosis, forearm
M72.44|Pseudosarcomatous fibromatosis, hand
M72.45|Pseudosarcomatous fibromatosis, pelvic region and thigh
M72.46|Pseudosarcomatous fibromatosis, lower leg
M72.47|Pseudosarcomatous fibromatosis, ankle and foot
M72.48|Pseudosarcomatous fibromatosis, other
M72.49|Pseudosarcomatous fibromatosis, site unspecified
M72.5|Fasciitis, not elsewhere classified
M72.50|Fasciitis, not elsewhere classified, multiple sites
M72.51|Fasciitis, not elsewhere classified, shoulder region
M72.52|Fasciitis, not elsewhere classified, upper arm
M72.53|Fasciitis, not elsewhere classified, forearm
M72.54|Fasciitis, not elsewhere classified, hand
M72.55|Fasciitis, not elsewhere classified, pelvic region and thigh
M72.56|Fasciitis, not elsewhere classified, lower leg
M72.57|Fasciitis, not elsewhere classified, ankle and foot
M72.58|Fasciitis, not elsewhere classified, other
M72.59|Fasciitis, not elsewhere classified, site unspecified
M72.6|Necrotizing fasciitis
M72.60|Necrotizing fasciitis, multiple sites
M72.61|Necrotizing fasciitis, shoulder region
M72.62|Necrotizing fasciitis, upper arm
M72.63|Necrotizing fasciitis, forearm
M72.64|Necrotizing fasciitis, hand
M72.65|Necrotizing fasciitis, pelvic region and thigh
M72.66|Necrotizing fasciitis, lower leg
M72.67|Necrotizing fasciitis, ankle and foot
M72.68|Necrotizing fasciitis, other
M72.69|Necrotizing fasciitis, site unspecified
M72.8|Other fibroblastic disorders
M72.80|Other fibroblastic disorders, multiple sites
M72.81|Other fibroblastic disorders, shoulder region
M72.82|Other fibroblastic disorders, upper arm
M72.83|Other fibroblastic disorders, forearm
M72.84|Other fibroblastic disorders, hand
M72.85|Other fibroblastic disorders, pelvic region and thigh
M72.86|Other fibroblastic disorders, lower leg
M72.87|Other fibroblastic disorders, ankle and foot
M72.88|Other fibroblastic disorders, other
M72.89|Other fibroblastic disorders, site unspecified
M72.9|Fibroblastic disorder, unspecified
M72.90|Fibroblastic disorder, unspecified, multiple sites
M72.91|Fibroblastic disorder, unspecified, shoulder region
M72.92|Fibroblastic disorder, unspecified, upper arm
M72.93|Fibroblastic disorder, unspecified, forearm
M72.94|Fibroblastic disorder, unspecified, hand
M72.95|Fibroblastic disorder, unspecified, pelvic region and thigh
M72.96|Fibroblastic disorder, unspecified, lower leg
M72.97|Fibroblastic disorder, unspecified, ankle and foot
M72.98|Fibroblastic disorder, unspecified, other
M72.99|Fibroblastic disorder, unspecified, site unspecified
M73|Soft tissue disorders in diseases classified elsewhere
M73.0|Gonococcal bursitis
M73.00|Gonococcal bursitis, multiple sites
M73.01|Gonococcal bursitis, shoulder region
M73.02|Gonococcal bursitis, upper arm
M73.03|Gonococcal bursitis, forearm
M73.04|Gonococcal bursitis, hand
M73.05|Gonococcal bursitis, pelvic region and thigh
M73.06|Gonococcal bursitis, lower leg
M73.07|Gonococcal bursitis, ankle and foot
M73.08|Gonococcal bursitis, other
M73.09|Gonococcal bursitis, site unspecified
M73.1|Syphilitic bursitis
M73.10|Syphilitic bursitis, multiple sites
M73.11|Syphilitic bursitis, shoulder region
M73.12|Syphilitic bursitis, upper arm
M73.13|Syphilitic bursitis, forearm
M73.14|Syphilitic bursitis, hand
M73.15|Syphilitic bursitis, pelvic region and thigh
M73.16|Syphilitic bursitis, lower leg
M73.17|Syphilitic bursitis, ankle and foot
M73.18|Syphilitic bursitis, other
M73.19|Syphilitic bursitis, site unspecified
M73.8|Other soft tissue disorders in diseases classified elsewhere
M73.80|Other soft tissue disorders in diseases classified elsewhere, multiple sites
M73.81|Other soft tissue disorders in diseases classified elsewhere, shoulder region
M73.82|Other soft tissue disorders in diseases classified elsewhere, upper arm
M73.83|Other soft tissue disorders in diseases classified elsewhere, forearm
M73.84|Other soft tissue disorders in diseases classified elsewhere, hand
M73.85|Other soft tissue disorders in diseases classified elsewhere, pelvic region and thigh
M73.86|Other soft tissue disorders in diseases classified elsewhere, lower leg
M73.87|Other soft tissue disorders in diseases classified elsewhere, ankle and foot
M73.88|Other soft tissue disorders in diseases classified elsewhere, other
M73.89|Other soft tissue disorders in diseases classified elsewhere, site unspecified
M75|Shoulder lesions
M75.0|Adhesive capsulitis of shoulder
M75.1|Rotator cuff syndrome
M75.2|Bicipital tendinitis
M75.3|Calcific tendinitis of shoulder
M75.4|Impingement syndrome of shoulder
M75.5|Bursitis of shoulder
M75.8|Other shoulder lesions
M75.9|Shoulder lesion, unspecified
M76|Enthesopathies of lower limb, excluding foot
M76.0|Gluteal tendinitis
M76.00|Gluteal tendinitis, multiple sites
M76.01|Gluteal tendinitis, shoulder region
M76.02|Gluteal tendinitis, upper arm
M76.03|Gluteal tendinitis, forearm
M76.04|Gluteal tendinitis, hand
M76.05|Gluteal tendinitis, pelvic region and thigh
M76.06|Gluteal tendinitis, lower leg
M76.07|Gluteal tendinitis, ankle and foot
M76.08|Gluteal tendinitis, other
M76.09|Gluteal tendinitis, site unspecified
M76.1|Psoas tendinitis
M76.10|Psoas tendinitis, multiple sites
M76.11|Psoas tendinitis, shoulder region
M76.12|Psoas tendinitis, upper arm
M76.13|Psoas tendinitis, forearm
M76.14|Psoas tendinitis, hand
M76.15|Psoas tendinitis, pelvic region and thigh
M76.16|Psoas tendinitis, lower leg
M76.17|Psoas tendinitis, ankle and foot
M76.18|Psoas tendinitis, other
M76.19|Psoas tendinitis, site unspecified
M76.2|Iliac crest spur
M76.20|Iliac crest spur, multiple sites
M76.21|Iliac crest spur, shoulder region
M76.22|Iliac crest spur, upper arm
M76.23|Iliac crest spur, forearm
M76.24|Iliac crest spur, hand
M76.25|Iliac crest spur, pelvic region and thigh
M76.26|Iliac crest spur, lower leg
M76.27|Iliac crest spur, ankle and foot
M76.28|Iliac crest spur, other
M76.29|Iliac crest spur, site unspecified
M76.3|Iliotibial band syndrome
M76.30|Iliotibial band syndrome, multiple sites
M76.31|Iliotibial band syndrome, shoulder region
M76.32|Iliotibial band syndrome, upper arm
M76.33|Iliotibial band syndrome, forearm
M76.34|Iliotibial band syndrome, hand
M76.35|Iliotibial band syndrome, pelvic region and thigh
M76.36|Iliotibial band syndrome, lower leg
M76.37|Iliotibial band syndrome, ankle and foot
M76.38|Iliotibial band syndrome, other
M76.39|Iliotibial band syndrome, site unspecified
M76.4|Tibial collateral bursitis [pellegrini-stieda]
M76.40|Tibial collateral bursitis [Pellegrini-Stieda], multiple sites
M76.41|Tibial collateral bursitis [Pellegrini-Stieda], shoulder region
M76.42|Tibial collateral bursitis [Pellegrini-Stieda], upper arm
M76.43|Tibial collateral bursitis [Pellegrini-Stieda], forearm
M76.44|Tibial collateral bursitis [Pellegrini-Stieda], hand
M76.45|Tibial collateral bursitis [Pellegrini-Stieda], pelvic region and thigh
M76.46|Tibial collateral bursitis [Pellegrini-Stieda], lower leg
M76.47|Tibial collateral bursitis [Pellegrini-Stieda], ankle and foot
M76.48|Tibial collateral bursitis [Pellegrini-Stieda], other
M76.49|Tibial collateral bursitis [pellegrini-stieda], site unspecified
M76.5|Patellar tendinitis
M76.50|Patellar tendinitis, multiple sites
M76.51|Patellar tendinitis, shoulder region
M76.52|Patellar tendinitis, upper arm
M76.53|Patellar tendinitis, forearm
M76.54|Patellar tendinitis, hand
M76.55|Patellar tendinitis, pelvic region and thigh
M76.56|Patellar tendinitis, lower leg
M76.57|Patellar tendinitis, ankle and foot
M76.58|Patellar tendinitis, other
M76.59|Patellar tendinitis, site unspecified
M76.6|Achilles tendinitis
M76.60|Achilles tendinitis, multiple sites
M76.61|Achilles tendinitis, shoulder region
M76.62|Achilles tendinitis, upper arm
M76.63|Achilles tendinitis, forearm
M76.64|Achilles tendinitis, hand
M76.65|Achilles tendinitis, pelvic region and thigh
M76.66|Achilles tendinitis, lower leg
M76.67|Achilles tendinitis, ankle and foot
M76.68|Achilles tendinitis, other
M76.69|Achilles tendinitis, site unspecified
M76.7|Peroneal tendinitis
M76.70|Peroneal tendinitis, multiple sites
M76.71|Peroneal tendinitis, shoulder region
M76.72|Peroneal tendinitis, upper arm
M76.73|Peroneal tendinitis, forearm
M76.74|Peroneal tendinitis, hand
M76.75|Peroneal tendinitis, pelvic region and thigh
M76.76|Peroneal tendinitis, lower leg
M76.77|Peroneal tendinitis, ankle and foot
M76.78|Peroneal tendinitis, other
M76.79|Peroneal tendinitis, site unspecified
M76.8|Other enthesopathies of lower limb, excluding foot
M76.80|Other enthesopathies of lower limb, excluding foot, multiple sites
M76.81|Other enthesopathies of lower limb, excluding foot, shoulder region
M76.82|Other enthesopathies of lower limb, excluding foot, upper arm
M76.83|Other enthesopathies of lower limb, excluding foot, forearm
M76.84|Other enthesopathies of lower limb, excluding foot, hand
M76.85|Other enthesopathies of lower limb, excluding foot, pelvic region and thigh
M76.86|Other enthesopathies of lower limb, excluding foot,  lower leg
M76.87|Other enthesopathies of lower limb, excluding foot, ankle and foot
M76.88|Other enthesopathies of lower limb, excluding foot, other
M76.89|Other enthesopathies of lower limb, excluding foot, site unspecified
M76.9|Enthesopathy of lower limb, unspecified
M76.90|Enthesopathy of lower limb, unspecified, multiple sites
M76.91|Enthesopathy of lower limb, unspecified, shoulder region
M76.92|Enthesopathy of lower limb, unspecified, upper arm
M76.93|Enthesopathy of lower limb, unspecified, forearm
M76.94|Enthesopathy of lower limb, unspecified, hand
M76.95|Enthesopathy of lower limb, unspecified, pelvic region and thigh
M76.96|Enthesopathy of lower limb, unspecified, lower leg
M76.97|Enthesopathy of lower limb, unspecified, ankle and foot
M76.98|Enthesopathy of lower limb, unspecified, other
M76.99|Enthesopathy of lower limb, unspecified, site unspecified
M77|Other enthesopathies
M77.0|Medial epicondylitis
M77.00|Medial epicondylitis, multiple sites
M77.01|Medial epicondylitis, shoulder region
M77.02|Medial epicondylitis, upper arm
M77.03|Medial epicondylitis, forearm
M77.04|Medial epicondylitis, hand
M77.05|Medial epicondylitis, pelvic region and thigh
M77.06|Medial epicondylitis, lower leg
M77.07|Medial epicondylitis, ankle and foot
M77.08|Medial epicondylitis, other
M77.09|Medial epicondylitis, site unspecified
M77.1|Lateral epicondylitis
M77.10|Lateral epicondylitis, multiple sites
M77.11|Lateral epicondylitis, shoulder region
M77.12|Lateral epicondylitis, upper arm
M77.13|Lateral epicondylitis, forearm
M77.14|Lateral epicondylitis, hand
M77.15|Lateral epicondylitis, pelvic region and thigh
M77.16|Lateral epicondylitis, lower leg
M77.17|Lateral epicondylitis, ankle and foot
M77.18|Lateral epicondylitis, other
M77.19|Lateral epicondylitis, site unspecified
M77.2|Periarthritis of wrist
M77.20|Periarthritis of wrist, multiple sites
M77.21|Periarthritis of wrist, shoulder region
M77.22|Periarthritis of wrist, upper arm
M77.23|Periarthritis of wrist, forearm
M77.24|Periarthritis of wrist, hand
M77.25|Periarthritis of wrist, pelvic region and thigh
M77.26|Periarthritis of wrist, lower leg
M77.27|Periarthritis of wrist, ankle and foot
M77.28|Periarthritis of wrist, other
M77.29|Periarthritis of wrist, site unspecified
M77.3|Calcaneal spur
M77.30|Calcaneal spur, multiple sites
M77.31|Calcaneal spur, shoulder region
M77.32|Calcaneal spur, upper arm
M77.33|Calcaneal spur, forearm
M77.34|Calcaneal spur,  hand
M77.35|Calcaneal spur, pelvic region and thigh
M77.36|Calcaneal spur, lower leg
M77.37|Calcaneal spur, ankle and foot
M77.38|Calcaneal spur, other
M77.39|Calcaneal spur, site unspecified
M77.4|Metatarsalgia
M77.40|Metatarsalgia, multiple sites
M77.41|Metatarsalgia, shoulder region
M77.42|Metatarsalgia, upper arm
M77.43|Metatarsalgia, forearm
M77.44|Metatarsalgia, hand
M77.45|Metatarsalgia, pelvic region and thigh
M77.46|Metatarsalgia, lower leg
M77.47|Metatarsalgia, ankle and foot
M77.48|Metatarsalgia, other
M77.49|Metatarsalgia, site unspecified
M77.5|Other enthesopathy of foot
M77.50|Other enthesopathy of foot, multiple sites
M77.51|Other enthesopathy of foot, shoulder region
M77.52|Other enthesopathy of foot, upper arm
M77.53|Other enthesopathy of foot, forearm
M77.54|Other enthesopathy of foot, hand
M77.55|Other enthesopathy of foot, pelvic region and thigh
M77.56|Other enthesopathy of foot, lower leg
M77.57|Other enthesopathy of foot, ankle and foot
M77.58|Other enthesopathy of foot, other
M77.59|Other enthesopathy of foot, site unspecified
M77.8|Other enthesopathies, not elsewhere classified
M77.80|Other enthesopathies, not elsewhere classified, multiple sites
M77.81|Other enthesopathies, not elsewhere classified, shoulder region
M77.82|Other enthesopathies, not elsewhere classified, upper arm
M77.83|Other enthesopathies, not elsewhere classified, forearm
M77.84|Other enthesopathies, not elsewhere classified, hand
M77.85|Other enthesopathies, not elsewhere classified, pelvic region and thigh
M77.86|Other enthesopathies, not elsewhere classified, lower leg
M77.87|Other enthesopathies, not elsewhere classified, ankle and foot
M77.88|Other enthesopathies, not elsewhere classified, other
M77.89|Other enthesopathies, not elsewhere classified, site unspecified
M77.9|Enthesopathy, unspecified
M77.90|Enthesopathy, unspecified, multiple sites
M77.91|Enthesopathy, unspecified, shoulder region
M77.92|Enthesopathy, unspecified, upper arm
M77.93|Enthesopathy, unspecified, forearm
M77.94|Enthesopathy, unspecified, hand
M77.95|Enthesopathy, unspecified, pelvic region and thigh
M77.96|Enthesopathy, unspecified, lower leg
M77.97|Enthesopathy, unspecified, ankle and foot
M77.98|Enthesopathy, unspecified, other
M77.99|Enthesopathy, unspecified, site unspecified
M79|Other soft tissue disorders, not elsewhere classified
M79.0|Rheumatism, unspecified
M79.00|Rheumatism, unspecified, multiple sites
M79.01|Rheumatism, unspecified, shoulder region
M79.02|Rheumatism, unspecified, upper arm
M79.03|Rheumatism, unspecified, forearm
M79.04|Rheumatism, unspecified, hand
M79.05|Rheumatism, unspecified, pelvic region and thigh
M79.06|Rheumatism, unspecified, lower leg
M79.07|Rheumatism, unspecified, ankle and foot
M79.08|Rheumatism, unspecified, other
M79.09|Rheumatism, unspecified, site unspecified
M79.1|Myalgia
M79.10|Myalgia, multiple sites
M79.11|Myalgia, shoulder region
M79.12|Myalgia, upper arm
M79.13|Myalgia, forearm
M79.14|Myalgia, hand
M79.15|Myalgia, pelvic and thigh
M79.16|Myalgia, lower leg
M79.17|Myalgia, ankle and foot
M79.18|Myalgia, other site
M79.19|Myalgia, site unspecified
M79.2|Neuralgia and neuritis, unspecified
M79.20|Neuralgia and neuritis, unspecified, multiple sites
M79.21|Neuralgia and neuritis, unspecified, shoulder region
M79.22|Neuralgia and neuritis, unspecified, upper arm
M79.23|Neuralgia and neuritis, unspecified, forearm
M79.24|Neuralgia and neuritis, unspecified, hand
M79.25|Neuralgia and neuritis, unspecified, pelvic and thigh
M79.26|Neuralgia and neuritis, unspecified, lower leg
M79.27|Neuralgia and neuritis, unspecified, ankle and foot
M79.28|Neuralgia and neuritis, unspecified, other site
M79.29|Neuralgia and neuritis, unspecified, site unspecified
M79.3|Panniculitis, unspecified
M79.30|Panniculitis, unspecified, multiple sites
M79.31|Panniculitis, unspecified, shoulder region
M79.32|Panniculitis, unspecified, upper arm
M79.33|Panniculitis, unspecified, forearm
M79.34|Panniculitis, unspecified, hand
M79.35|Panniculitis, unspecified, pelvic and thigh
M79.36|Panniculitis, unspecified, lower leg
M79.37|Panniculitis, unspecified, ankle and foot
M79.38|Panniculitis, unspecified, other site
M79.39|Panniculitis, unspecified, site unspecified
M79.4|Hypertrophy of (infrapatellar) fat pad
M79.40|Hypertrophy of (infrapatellar) fat pad, multiple sites
M79.41|Hypertrophy of (infrapatellar) fat pad, shoulder region
M79.42|Hypertrophy of (infrapatellar) fat pad, upper arm
M79.43|Hypertrophy of (infrapatellar) fat pad, forearm
M79.44|Hypertrophy of (infrapatellar) fat pad, hand
M79.45|Hypertrophy of (infrapatellar) fat pad, pelvic region and thigh
M79.46|Hypertrophy of (infrapatellar) fat pad, lower leg
M79.47|Hypertrophy of (infrapatellar) fat pad, ankle and foot
M79.48|Hypertrophy of (infrapatellar) fat pad, other
M79.49|Hypertrophy of (infrapatellar) fat pad, site unspecified
M79.5|Residual foreign body in soft tissue
M79.50|Residual foreign body in soft tissue, multiple sites
M79.51|Residual foreign body in soft tissue, shoulder region
M79.52|Residual foreign body in soft tissue, upper arm
M79.53|Residual foreign body in soft tissue, forearm
M79.54|Residual foreign body in soft tissue, hand
M79.55|Residual foreign body in soft tissue, pelvic and thigh
M79.56|Residual foreign body in soft tissue, lower leg
M79.57|Residual foreign body in soft tissue, ankle and foot
M79.58|Residual foreign body in soft tissue, other site
M79.59|Residual foreign body in soft tissue, site unspecified
M79.6|Pain in limb
M79.60|Pain in limb, multiple sites
M79.61|Pain in limb, shoulder region
M79.62|Pain in limb, upper arm
M79.63|Pain in limb, forearm
M79.64|Pain in limb, hand
M79.65|Pain in limb, pelvic and thigh
M79.66|Pain in limb, lower leg
M79.67|Pain in limb, ankle and foot
M79.68|Pain in limb, other site
M79.69|Pain in limb, site unspecified
M79.7|Fibromyalgia
M79.8|Other specified soft tissue disorders
M79.80|Other specified soft tissue disorders, multiple sites
M79.81|Other specified soft tissue disorders, shoulder region
M79.82|Other specified soft tissue disorders, upper arm
M79.83|Other specified soft tissue disorders, forearm
M79.84|Other specified soft tissue disorders, hand
M79.85|Other specified soft tissue disorders, pelvic and thigh
M79.86|Other specified soft tissue disorders, lower leg
M79.87|Other specified soft tissue disorders, ankle and foot
M79.88|Other specified soft tissue disorders, other site
M79.89|Other specified soft tissue disorders, site unspecified
M79.9|Soft tissue disorder, unspecified
M79.90|Soft tissue disorder, unspecified, multiple sites
M79.91|Soft tissue disorder, unspecified, shoulder region
M79.92|Soft tissue disorder, unspecified, upper arm
M79.93|Soft tissue disorder, unspecified, forearm
M79.94|Soft tissue disorder, unspecified, hand
M79.95|Soft tissue disorder, unspecified, pelvic and thigh
M79.96|Soft tissue disorder, unspecified, lower leg
M79.97|Soft tissue disorder, unspecified, ankle and foot
M79.98|Soft tissue disorder, unspecified, other site
M79.99|Soft tissue disorder, unspecified, site unspecified
M80|Osteoporosis with pathological fracture
M80.0|Postmenopausal osteoporosis with pathological fracture
M80.00|Postmenopausal osteoporosis with pathological fracture, multiple sites
M80.01|Postmenopausal osteoporosis with pathological fracture, shoulder region
M80.02|Postmenopausal osteoporosis with pathological fracture, upper arm
M80.03|Postmenopausal osteoporosis with pathological fracture, forearm
M80.04|Postmenopausal osteoporosis with pathological fracture, hand
M80.05|Postmenopausal osteoporosis with pathological fracture, pelvic and thigh
M80.06|Postmenopausal osteoporosis with pathological fracture, lower leg
M80.07|Postmenopausal osteoporosis with pathological fracture, ankle and foot
M80.08|Postmenopausal osteoporosis with pathological fracture, other site
M80.09|Postmenopausal osteoporosis with pathological fracture, site unspecified
M80.1|Postoophorectomy osteoporosis with pathological fracture
M80.10|Postoophorectomy osteoporosis with pathological fracture, multiple sites
M80.11|Postoophorectomy osteoporosis with pathological fracture, shoulder region
M80.12|Postoophorectomy osteoporosis with pathological fracture, upper arm
M80.13|Postoophorectomy osteoporosis with pathological fracture, forearm
M80.14|Postoophorectomy osteoporosis with pathological fracture, hand
M80.15|Postoophorectomy osteoporosis with pathological fracture, pelvic and thigh
M80.16|Postoophorectomy osteoporosis with pathological fracture, lower leg
M80.17|Postoophorectomy osteoporosis with pathological fracture, ankle and foot
M80.18|Postoophorectomy osteoporosis with pathological fracture, other site
M80.19|Postoophorectomy osteoporosis with pathological fracture, site unspecified
M80.2|Osteoporosis of disuse with pathological fracture
M80.20|Osteoporosis of disuse with pathological fracture, multiple sites
M80.21|Osteoporosis of disuse with pathological fracture, shoulder region
M80.22|Osteoporosis of disuse with pathological fracture, upper arm
M80.23|Osteoporosis of disuse with pathological fracture, forearm
M80.24|Osteoporosis of disuse with pathological fracture, hand
M80.25|Osteoporosis of disuse with pathological fracture, pelvic and thigh
M80.26|Osteoporosis of disuse with pathological fracture, lower leg
M80.27|Osteoporosis of disuse with pathological fracture, ankle and foot
M80.28|Osteoporosis of disuse with pathological fracture, other site
M80.29|Osteoporosis of disuse with pathological fracture, site unspecified
M80.3|Postsurgical malabsorption osteoporosis with path fracture
M80.30|Postsurgical malabsorption osteoporosis with path fracture, multiple sites
M80.31|Postsurgical malabsorption osteoporosis with path fracture, shoulder region
M80.32|Postsurgical malabsorption osteoporosis with path fracture, upper arm
M80.33|Postsurgical malabsorption osteoporosis with path fracture, forearm
M80.34|Postsurgical malabsorption osteoporosis with path fracture, hand
M80.35|Postsurgical malabsorption osteoporosis with path fracture, pelvic and thigh
M80.36|Postsurgical malabsorption osteoporosis with path fracture, lower leg
M80.37|Postsurgical malabsorption osteoporosis with path fracture, ankle and foot
M80.38|Postsurgical malabsorption osteoporosis with path fracture, other site
M80.39|Postsurgical malabsorption osteoporosis with path fracture, site unspecified
M80.4|Drug-induced osteoporosis with pathological fracture
M80.40|Drug-induced osteoporosis with pathological fracture, multiple sites
M80.41|Drug-induced osteoporosis with pathological fracture, shoulder region
M80.42|Drug-induced osteoporosis with pathological fracture, upper arm
M80.43|Drug-induced osteoporosis with pathological fracture, forearm
M80.44|Drug-induced osteoporosis with pathological fracture, hand
M80.45|Drug-induced osteoporosis with pathological fracture, pelvic and thigh
M80.46|Drug-induced osteoporosis with pathological fracture, lower leg
M80.47|Drug-induced osteoporosis with pathological fracture, ankle and foot
M80.48|Drug-induced osteoporosis with pathological fracture, other site
M80.49|Drug-induced osteoporosis with pathological fracture, site unspecified
M80.5|Idiopathic osteoporosis with pathological fracture
M80.50|Idiopathic osteoporosis with pathological fracture, multiple sites
M80.51|Idiopathic osteoporosis with pathological fracture, shoulder region
M80.52|Idiopathic osteoporosis with pathological fracture, upper arm
M80.53|Idiopathic osteoporosis with pathological fracture, forearm
M80.54|Idiopathic osteoporosis with pathological fracture, hand
M80.55|Idiopathic osteoporosis with pathological fracture, pelvic and thigh
M80.56|Idiopathic osteoporosis with pathological fracture, lower leg
M80.57|Idiopathic osteoporosis with pathological fracture, ankle and foot
M80.58|Idiopathic osteoporosis with pathological fracture, other site
M80.59|Idiopathic osteoporosis with pathological fracture, site unspecified
M80.8|Other osteoporosis with pathological fracture
M80.80|Other osteoporosis with pathological fracture, multiple sites
M80.81|Other osteoporosis with pathological fracture, shoulder region
M80.82|Other osteoporosis with pathological fracture, upper arm
M80.83|Other osteoporosis with pathological fracture, forearm
M80.84|Other osteoporosis with pathological fracture, hand
M80.85|Other osteoporosis with pathological fracture, pelvic and thigh
M80.86|Other osteoporosis with pathological fracture, lower leg
M80.87|Other osteoporosis with pathological fracture, ankle and foot
M80.88|Other osteoporosis with pathological fracture, other site
M80.89|Other osteoporosis with pathological fracture, site unspecified
M80.9|Unspecified osteoporosis with pathological fracture
M80.90|Unspecified osteoporosis with pathological fracture, multiple sites
M80.91|Unspecified osteoporosis with pathological fracture, shoulder region
M80.92|Unspecified osteoporosis with pathological fracture, upper arm
M80.93|Unspecified osteoporosis with pathological fracture, forearm
M80.94|Unspecified osteoporosis with pathological fracture, hand
M80.95|Unspecified osteoporosis with pathological fracture, pelvic and thigh
M80.96|Unspecified osteoporosis with pathological fracture, lower leg
M80.97|Unspecified osteoporosis with pathological fracture, ankle and foot
M80.98|Unspecified osteoporosis with pathological fracture, other site
M80.99|Unspecified osteoporosis with pathological fracture, site unspecified
M81|Osteoporosis without pathological fracture
M81.0|Postmenopausal osteoporosis
M81.00|Postmenopausal osteoporosis, multiple sites
M81.01|Postmenopausal osteoporosis, shoulder region
M81.02|Postmenopausal osteoporosis, upper arm
M81.03|Postmenopausal osteoporosis, forearm
M81.04|Postmenopausal osteoporosis, hand
M81.05|Postmenopausal osteoporosis, pelvic and thigh
M81.06|Postmenopausal osteoporosis, lower leg
M81.07|Postmenopausal osteoporosis, ankle and foot
M81.08|Postmenopausal osteoporosis, other site
M81.09|Postmenopausal osteoporosis, site unspecified
M81.1|Postoophorectomy osteoporosis
M81.10|Postoophorectomy osteoporosis, multiple sites
M81.11|Postoophorectomy osteoporosis, shoulder region
M81.12|Postoophorectomy osteoporosis, upper arm
M81.13|Postoophorectomy osteoporosis, forearm
M81.14|Postoophorectomy osteoporosis, hand
M81.15|Postoophorectomy osteoporosis, pelvic and thigh
M81.16|Postoophorectomy osteoporosis, lower leg
M81.17|Postoophorectomy osteoporosis, ankle and foot
M81.18|Postoophorectomy osteoporosis, other site
M81.19|Postoophorectomy osteoporosis, site unspecified
M81.2|Osteoporosis of disuse
M81.20|Osteoporosis of disuse, multiple sites
M81.21|Osteoporosis of disuse, shoulder region
M81.22|Osteoporosis of disuse, upper arm
M81.23|Osteoporosis of disuse, forearm
M81.24|Osteoporosis of disuse, hand
M81.25|Osteoporosis of disuse, pelvic and thigh
M81.26|Osteoporosis of disuse, lower leg
M81.27|Osteoporosis of disuse, ankle and foot
M81.28|Osteoporosis of disuse, other site
M81.29|Osteoporosis of disuse, site unspecified
M81.3|Postsurgical malabsorption osteoporosis
M81.30|Postsurgical malabsorption osteoporosis, multiple sites
M81.31|Postsurgical malabsorption osteoporosis, shoulder region
M81.32|Postsurgical malabsorption osteoporosis, upper arm
M81.33|Postsurgical malabsorption osteoporosis, forearm
M81.34|Postsurgical malabsorption osteoporosis, hand
M81.35|Postsurgical malabsorption osteoporosis, pelvic and thigh
M81.36|Postsurgical malabsorption osteoporosis, lower leg
M81.37|Postsurgical malabsorption osteoporosis, ankle and foot
M81.38|Postsurgical malabsorption osteoporosis, other site
M81.39|Postsurgical malabsorption osteoporosis, site unspecified
M81.4|Drug-induced osteoporosis
M81.40|Drug-induced osteoporosis, multiple sites
M81.41|Drug-induced osteoporosis, shoulder region
M81.42|Drug-induced osteoporosis, upper arm
M81.43|Drug-induced osteoporosis, forearm
M81.44|Drug-induced osteoporosis, hand
M81.45|Drug-induced osteoporosis, pelvic and thigh
M81.46|Drug-induced osteoporosis, lower leg
M81.47|Drug-induced osteoporosis, ankle and foot
M81.48|Drug-induced osteoporosis, other site
M81.49|Drug-induced osteoporosis, site unspecified
M81.5|Idiopathic osteoporosis
M81.50|Idiopathic osteoporosis, multiple sites
M81.51|Idiopathic osteoporosis, shoulder region
M81.52|Idiopathic osteoporosis, upper arm
M81.53|Idiopathic osteoporosis, forearm
M81.54|Idiopathic osteoporosis, hand
M81.55|Idiopathic osteoporosis, pelvic and thigh
M81.56|Idiopathic osteoporosis, lower leg
M81.57|Idiopathic osteoporosis, ankle and foot
M81.58|Idiopathic osteoporosis, other site
M81.59|Idiopathic osteoporosis, site unspecified
M81.6|Localized osteoporosis [lequesne]
M81.60|Localized osteoporosis [lequesne], multiple sites
M81.61|Localized osteoporosis [lequesne], shoulder region
M81.62|Localized osteoporosis [lequesne], upper arm
M81.63|Localized osteoporosis [lequesne], forearm
M81.64|Localized osteoporosis [lequesne], hand
M81.65|Localized osteoporosis [lequesne], pelvic and thigh
M81.66|Localized osteoporosis [lequesne], lower leg
M81.67|Localized osteoporosis [lequesne], ankle and foot
M81.68|Localized osteoporosis [lequesne], other site
M81.69|Localized osteoporosis [lequesne], site unspecified
M81.8|Other osteoporosis
M81.80|Other osteoporosis, multiple sites
M81.81|Other osteoporosis, shoulder region
M81.82|Other osteoporosis, upper arm
M81.83|Other osteoporosis, forearm
M81.84|Other osteoporosis, hand
M81.85|Other osteoporosis, pelvic and thigh
M81.86|Other osteoporosis, lower leg
M81.87|Other osteoporosis, ankle and foot
M81.88|Other osteoporosis, other site
M81.89|Other osteoporosis, site unspecified
M81.9|Osteoporosis, unspecified
M81.90|Osteoporosis, unspecified, multiple sites
M81.91|Osteoporosis, unspecified, shoulder region
M81.92|Osteoporosis, unspecified, upper arm
M81.93|Osteoporosis, unspecified, forearm
M81.94|Osteoporosis, unspecified, hand
M81.95|Osteoporosis, unspecified, pelvic and thigh
M81.96|Osteoporosis, unspecified, lower leg
M81.97|Osteoporosis, unspecified, ankle and foot
M81.98|Osteoporosis, unspecified, other site
M81.99|Osteoporosis, unspecified, site unspecified
M82|Osteoporosis in diseases classified elsewhere
M82.0|Osteoporosis in multiple myelomatosis
M82.00|Osteoporosis in multiple myelomatosis, multiple sites
M82.01|Osteoporosis in multiple myelomatosis, shoulder region
M82.02|Osteoporosis in multiple myelomatosis, upper arm
M82.03|Osteoporosis in multiple myelomatosis, forearm
M82.04|Osteoporosis in multiple myelomatosis, hand
M82.05|Osteoporosis in multiple myelomatosis, pelvic and thigh
M82.06|Osteoporosis in multiple myelomatosis, lower leg
M82.07|Osteoporosis in multiple myelomatosis, ankle and foot
M82.08|Osteoporosis in multiple myelomatosis, other site
M82.09|Osteoporosis in multiple myelomatosis, site unspecified
M82.1|Osteoporosis in endocrine disorders
M82.10|Osteoporosis in endocrine disorders, multiple sites
M82.11|Osteoporosis in endocrine disorders, shoulder region
M82.12|Osteoporosis in endocrine disorders, upper arm
M82.13|Osteoporosis in endocrine disorders, forearm
M82.14|Osteoporosis in endocrine disorders, hand
M82.15|Osteoporosis in endocrine disorders, pelvic and thigh
M82.16|Osteoporosis in endocrine disorders, lower leg
M82.17|Osteoporosis in endocrine disorders, ankle and foot
M82.18|Osteoporosis in endocrine disorders, other site
M82.19|Osteoporosis in endocrine disorders, site unspecified
M82.8|Osteoporosis in other diseases classified elsewhere
M82.80|Osteoporosis in other diseases classified elsewhere, multiple sites
M82.81|Osteoporosis in other diseases classified elsewhere, shoulder region
M82.82|Osteoporosis in other diseases classified elsewhere, upper arm
M82.83|Osteoporosis in other diseases classified elsewhere, forearm
M82.84|Osteoporosis in other diseases classified elsewhere, hand
M82.85|Osteoporosis in other diseases classified elsewhere, pelvic and thigh
M82.86|Osteoporosis in other diseases classified elsewhere, lower leg
M82.87|Osteoporosis in other diseases classified elsewhere, ankle and foot
M82.88|Osteoporosis in other diseases classified elsewhere, other site
M82.89|Osteoporosis in other diseases classified elsewhere, site unspecified
M83|Adult osteomalacia
M83.0|Puerperal osteomalacia
M83.00|Puerperal osteomalacia, multiple sites
M83.01|Puerperal osteomalacia, shoulder region
M83.02|Puerperal osteomalacia, upper arm
M83.03|Puerperal osteomalacia, forearm
M83.04|Puerperal osteomalacia, hand
M83.05|Puerperal osteomalacia, pelvic and thigh
M83.06|Puerperal osteomalacia, lower leg
M83.07|Puerperal osteomalacia, ankle and foot
M83.08|Puerperal osteomalacia, other site
M83.09|Puerperal osteomalacia, site unspecified
M83.1|Senile osteomalacia
M83.10|Senile osteomalacia, multiple sites
M83.11|Senile osteomalacia, shoulder region
M83.12|Senile osteomalacia, upper arm
M83.13|Senile osteomalacia, forearm
M83.14|Senile osteomalacia, hand
M83.15|Senile osteomalacia, pelvic and thigh
M83.16|Senile osteomalacia, lower leg
M83.17|Senile osteomalacia, ankle and foot
M83.18|Senile osteomalacia, other site
M83.19|Senile osteomalacia, site unspecified
M83.2|Adult osteomalacia due to malabsorption
M83.20|Adult osteomalacia due to malabsorption, multiple sites
M83.21|Adult osteomalacia due to malabsorption, shoulder region
M83.22|Adult osteomalacia due to malabsorption, upper arm
M83.23|Adult osteomalacia due to malabsorption, forearm
M83.24|Adult osteomalacia due to malabsorption, hand
M83.25|Adult osteomalacia due to malabsorption, pelvic and thigh
M83.26|Adult osteomalacia due to malabsorption, lower leg
M83.27|Adult osteomalacia due to malabsorption, ankle and foot
M83.28|Adult osteomalacia due to malabsorption, other site
M83.29|Adult osteomalacia due to malabsorption, site unspecified
M83.3|Adult osteomalacia due to malnutrition
M83.30|Adult osteomalacia due to malnutrition, multiple sites
M83.31|Adult osteomalacia due to malnutrition, shoulder region
M83.32|Adult osteomalacia due to malnutrition, upper arm
M83.33|Adult osteomalacia due to malnutrition, forearm
M83.34|Adult osteomalacia due to malnutrition, hand
M83.35|Adult osteomalacia due to malnutrition, pelvic and thigh
M83.36|Adult osteomalacia due to malnutrition, lower leg
M83.37|Adult osteomalacia due to malnutrition, ankle and foot
M83.38|Adult osteomalacia due to malnutrition, other site
M83.39|Adult osteomalacia due to malnutrition, site unspecified
M83.4|Aluminium bone disease
M83.40|Aluminium bone disease, multiple sites
M83.41|Aluminium bone disease, shoulder region
M83.42|Aluminium bone disease, upper arm
M83.43|Aluminium bone disease, forearm
M83.44|Aluminium bone disease, hand
M83.45|Aluminium bone disease, pelvic and thigh
M83.46|Aluminium bone disease, lower leg
M83.47|Aluminium bone disease, ankle and foot
M83.48|Aluminium bone disease, other site
M83.49|Aluminium bone disease, site unspecified
M83.5|Other drug-induced osteomalacia in adults
M83.50|Other drug-induced osteomalacia in adults, multiple sites
M83.51|Other drug-induced osteomalacia in adults, shoulder region
M83.52|Other drug-induced osteomalacia in adults, upper arm
M83.53|Other drug-induced osteomalacia in adults, forearm
M83.54|Other drug-induced osteomalacia in adults, hand
M83.55|Other drug-induced osteomalacia in adults, pelvic and thigh
M83.56|Other drug-induced osteomalacia in adults, lower leg
M83.57|Other drug-induced osteomalacia in adults, ankle and foot
M83.58|Other drug-induced osteomalacia in adults, other site
M83.59|Other drug-induced osteomalacia in adults, site unspecified
M83.8|Other adult osteomalacia
M83.80|Other adult osteomalacia, multiple sites
M83.81|Other adult osteomalacia, shoulder region
M83.82|Other adult osteomalacia, upper arm
M83.83|Other adult osteomalacia, forearm
M83.84|Other adult osteomalacia, hand
M83.85|Other adult osteomalacia, pelvic and thigh
M83.86|Other adult osteomalacia, lower leg
M83.87|Other adult osteomalacia, ankle and foot
M83.88|Other adult osteomalacia, other site
M83.89|Other adult osteomalacia, site unspecified
M83.9|Adult osteomalacia, unspecified
M83.90|Adult osteomalacia, unspecified, multiple sites
M83.91|Adult osteomalacia, unspecified, shoulder region
M83.92|Adult osteomalacia, unspecified, upper arm
M83.93|Adult osteomalacia, unspecified, forearm
M83.94|Adult osteomalacia, unspecified, hand
M83.95|Adult osteomalacia, unspecified, pelvic and thigh
M83.96|Adult osteomalacia, unspecified, lower leg
M83.97|Adult osteomalacia, unspecified, ankle and foot
M83.98|Adult osteomalacia, unspecified, other site
M83.99|Adult osteomalacia, unspecified, site unspecified
M84|Disorders of continuity of bone
M84.0|Malunion of fracture
M84.00|Malunion of fracture, multiple sites
M84.01|Malunion of fracture, shoulder region
M84.02|Malunion of fracture, upper arm
M84.03|Malunion of fracture, forearm
M84.04|Malunion of fracture, hand
M84.05|Malunion of fracture, pelvic and thigh
M84.06|Malunion of fracture, lower leg
M84.07|Malunion of fracture, ankle and foot
M84.08|Malunion of fracture, other site
M84.09|Malunion of fracture, site unspecified
M84.1|Nonunion of fracture [pseudarthrosis]
M84.10|Nonunion of fracture [pseudarthrosis], multiple sites
M84.11|Nonunion of fracture [pseudarthrosis], shoulder region
M84.12|Nonunion of fracture [pseudarthrosis], upper arm
M84.13|Nonunion of fracture [pseudarthrosis], forearm
M84.14|Nonunion of fracture [pseudarthrosis], hand
M84.15|Nonunion of fracture [pseudarthrosis], pelvic and thigh
M84.16|Nonunion of fracture [pseudarthrosis], lower leg
M84.17|Nonunion of fracture [pseudarthrosis], ankle and foot
M84.18|Nonunion of fracture [pseudarthrosis], other site
M84.19|Nonunion of fracture [pseudarthrosis], site unspecified
M84.2|Delayed union of fracture
M84.20|Delayed union of fracture, multiple sites
M84.21|Delayed union of fracture, shoulder region
M84.22|Delayed union of fracture, upper arm
M84.23|Delayed union of fracture, forearm
M84.24|Delayed union of fracture, hand
M84.25|Delayed union of fracture, pelvic and thigh
M84.26|Delayed union of fracture, lower leg
M84.27|Delayed union of fracture, ankle and foot
M84.28|Delayed union of fracture, other site
M84.29|Delayed union of fracture, site unspecified
M84.3|Stress fracture, not elsewhere classified
M84.30|Stress fracture, not elsewhere classified, multiple sites
M84.31|Stress fracture, not elsewhere classified, shoulder region
M84.32|Stress fracture, not elsewhere classified, upper arm
M84.33|Stress fracture, not elsewhere classified, forearm
M84.34|Stress fracture, not elsewhere classified, hand
M84.35|Stress fracture, not elsewhere classified, pelvic and thigh
M84.36|Stress fracture, not elsewhere classified, lower leg
M84.37|Stress fracture, not elsewhere classified, ankle and foot
M84.38|Stress fracture, not elsewhere classified, other site
M84.39|Stress fracture, not elsewhere classified, site unspecified
M84.4|Pathological fracture, not elsewhere classified
M84.40|Pathological fracture, not elsewhere classified, multiple sites
M84.41|Pathological fracture, not elsewhere classified, shoulder region
M84.42|Pathological fracture, not elsewhere classified, upper arm
M84.43|Pathological fracture, not elsewhere classified, forearm
M84.44|Pathological fracture, not elsewhere classified, hand
M84.45|Pathological fracture, not elsewhere classified, pelvic and thigh
M84.46|Pathological fracture, not elsewhere classified, lower leg
M84.47|Pathological fracture, not elsewhere classified, ankle and foot
M84.48|Pathological fracture, not elsewhere classified, other site
M84.49|Pathological fracture, not elsewhere classified, site unspecified
M84.8|Other disorders of continuity of bone
M84.80|Other disorders of continuity of bone, multiple sites
M84.81|Other disorders of continuity of bone, shoulder region
M84.82|Other disorders of continuity of bone, upper arm
M84.83|Other disorders of continuity of bone, forearm
M84.84|Other disorders of continuity of bone, hand
M84.85|Other disorders of continuity of bone, pelvic and thigh
M84.86|Other disorders of continuity of bone, lower leg
M84.87|Other disorders of continuity of bone, ankle and foot
M84.88|Other disorders of continuity of bone, other site
M84.89|Other disorders of continuity of bone, site unspecified
M84.9|Disorder of continuity of bone, unspecified
M84.90|Disorder of continuity of bone, unspecified, multiple sites
M84.91|Disorder of continuity of bone, unspecified, shoulder region
M84.92|Disorder of continuity of bone, unspecified, upper arm
M84.93|Disorder of continuity of bone, unspecified, forearm
M84.94|Disorder of continuity of bone, unspecified, hand
M84.95|Disorder of continuity of bone, unspecified, pelvic and thigh
M84.96|Disorder of continuity of bone, unspecified, lower leg
M84.97|Disorder of continuity of bone, unspecified, ankle and foot
M84.98|Disorder of continuity of bone, unspecified, other site
M84.99|Disorder of continuity of bone, unspecified, site unspecified
M85|Other disorders of bone density and structure
M85.0|Fibrous dysplasia (monostotic)
M85.00|Fibrous dysplasia (monostotic), multiple sites
M85.01|Fibrous dysplasia (monostotic), shoulder region
M85.02|Fibrous dysplasia (monostotic), upper arm
M85.03|Fibrous dysplasia (monostotic), forearm
M85.04|Fibrous dysplasia (monostotic), hand
M85.05|Fibrous dysplasia (monostotic), pelvic and thigh
M85.06|Fibrous dysplasia (monostotic), lower leg
M85.07|Fibrous dysplasia (monostotic), ankle and foot
M85.08|Fibrous dysplasia (monostotic), other site
M85.09|Fibrous dysplasia (monostotic), site unspecified
M85.1|Skeletal fluorosis
M85.10|Skeletal fluorosis, multiple sites
M85.11|Skeletal fluorosis, shoulder region
M85.12|Skeletal fluorosis, upper arm
M85.13|Skeletal fluorosis, forearm
M85.14|Skeletal fluorosis, hand
M85.15|Skeletal fluorosis, pelvic and thigh
M85.16|Skeletal fluorosis, lower leg
M85.17|Skeletal fluorosis, ankle and foot
M85.18|Skeletal fluorosis, other site
M85.19|Skeletal fluorosis, site unspecified
M85.2|Hyperostosis of skull
M85.20|Hyperostosis of skull, multiple sites
M85.21|Hyperostosis of skull, shoulder region
M85.22|Hyperostosis of skull, upper arm
M85.23|Hyperostosis of skull, forearm
M85.24|Hyperostosis of skull, hand
M85.25|Hyperostosis of skull, pelvic region and thigh
M85.26|Hyperostosis of skull, lower leg
M85.27|Hyperostosis of skull, ankle and foot
M85.28|Hyperostosis of skull, other
M85.29|Hyperostosis of skull, site unspecified
M85.3|Osteitis condensans
M85.30|Osteitis condensans, multiple sites
M85.31|Osteitis condensans, shoulder region
M85.32|Osteitis condensans, upper arm
M85.33|Osteitis condensans, forearm
M85.34|Osteitis condensans, hand
M85.35|Osteitis condensans, pelvic and thigh
M85.36|Osteitis condensans, lower leg
M85.37|Osteitis condensans, ankle and foot
M85.38|Osteitis condensans, other site
M85.39|Osteitis condensans, site unspecified
M85.4|Solitary bone cyst
M85.40|Solitary bone cyst, multiple sites
M85.41|Solitary bone cyst, shoulder region
M85.42|Solitary bone cyst, upper arm
M85.43|Solitary bone cyst, forearm
M85.44|Solitary bone cyst, hand
M85.45|Solitary bone cyst, pelvic and thigh
M85.46|Solitary bone cyst, lower leg
M85.47|Solitary bone cyst, ankle and foot
M85.48|Solitary bone cyst, other site
M85.49|Solitary bone cyst, site unspecified
M85.5|Aneurysmal bone cyst
M85.50|Aneurysmal bone cyst, multiple sites
M85.51|Aneurysmal bone cyst, shoulder region
M85.52|Aneurysmal bone cyst, upper arm
M85.53|Aneurysmal bone cyst, forearm
M85.54|Aneurysmal bone cyst, hand
M85.55|Aneurysmal bone cyst, pelvic and thigh
M85.56|Aneurysmal bone cyst, lower leg
M85.57|Aneurysmal bone cyst, ankle and foot
M85.58|Aneurysmal bone cyst, other site
M85.59|Aneurysmal bone cyst, site unspecified
M85.6|Other cyst of bone
M85.60|Other cyst of bone, multiple sites
M85.61|Other cyst of bone, shoulder region
M85.62|Other cyst of bone, upper arm
M85.63|Other cyst of bone, forearm
M85.64|Other cyst of bone, hand
M85.65|Other cyst of bone, pelvic and thigh
M85.66|Other cyst of bone, lower leg
M85.67|Other cyst of bone, ankle and foot
M85.68|Other cyst of bone, other site
M85.69|Other cyst of bone, site unspecified
M85.8|Other specified disorders of bone density and structure
M85.80|Other specified disorders of bone density and structure, multiple sites
M85.81|Other specified disorders of bone density and structure, shoulder region
M85.82|Other specified disorders of bone density and structure, upper arm
M85.83|Other specified disorders of bone density and structure, forearm
M85.84|Other specified disorders of bone density and structure, hand
M85.85|Other specified disorders of bone density and structure, pelvic and thigh
M85.86|Other specified disorders of bone density and structure, lower leg
M85.87|Other specified disorders of bone density and structure, ankle and foot
M85.88|Other specified disorders of bone density and structure, other site
M85.89|Other specified disorders of bone density and structure, site unspecified
M85.9|Disorder of bone density and structure, unspecified
M85.90|Disorder of bone density and structure, unspecified, multiple sites
M85.91|Disorder of bone density and structure, unspecified, shoulder region
M85.92|Disorder of bone density and structure, unspecified, upper arm
M85.93|Disorder of bone density and structure, unspecified, forearm
M85.94|Disorder of bone density and structure, unspecified, hand
M85.95|Disorder of bone density and structure, unspecified, pelvic and thigh
M85.96|Disorder of bone density and structure, unspecified, lower leg
M85.97|Disorder of bone density and structure, unspecified, ankle and foot
M85.98|Disorder of bone density and structure, unspecified, other site
M85.99|Disorder of bone density and structure, unspecified, site unspecified
M86|Osteomyelitis
M86.0|Acute haematogenous osteomyelitis
M86.00|Acute haematogenous osteomyelitis, multiple sites
M86.01|Acute haematogenous osteomyelitis, shoulder region
M86.02|Acute haematogenous osteomyelitis, upper arm
M86.03|Acute haematogenous osteomyelitis, forearm
M86.04|Acute haematogenous osteomyelitis, hand
M86.05|Acute haematogenous osteomyelitis, pelvic and thigh
M86.06|Acute haematogenous osteomyelitis, lower leg
M86.07|Acute haematogenous osteomyelitis, ankle and foot
M86.08|Acute haematogenous osteomyelitis, other site
M86.09|Acute haematogenous osteomyelitis, site unspecified
M86.1|Other acute osteomyelitis
M86.10|Other acute osteomyelitis, multiple sites
M86.11|Other acute osteomyelitis, shoulder region
M86.12|Other acute osteomyelitis, upper arm
M86.13|Other acute osteomyelitis, forearm
M86.14|Other acute osteomyelitis, hand
M86.15|Other acute osteomyelitis, pelvic and thigh
M86.16|Other acute osteomyelitis, lower leg
M86.17|Other acute osteomyelitis, ankle and foot
M86.18|Other acute osteomyelitis, other site
M86.19|Other acute osteomyelitis, site unspecified
M86.2|Subacute osteomyelitis
M86.20|Subacute osteomyelitis, multiple sites
M86.21|Subacute osteomyelitis, shoulder region
M86.22|Subacute osteomyelitis, upper arm
M86.23|Subacute osteomyelitis, forearm
M86.24|Subacute osteomyelitis, hand
M86.25|Subacute osteomyelitis, pelvic and thigh
M86.26|Subacute osteomyelitis, lower leg
M86.27|Subacute osteomyelitis, ankle and foot
M86.28|Subacute osteomyelitis, other site
M86.29|Subacute osteomyelitis, site unspecified
M86.3|Chronic multifocal osteomyelitis
M86.30|Chronic multifocal osteomyelitis, multiple sites
M86.31|Chronic multifocal osteomyelitis, shoulder region
M86.32|Chronic multifocal osteomyelitis, upper arm
M86.33|Chronic multifocal osteomyelitis, forearm
M86.34|Chronic multifocal osteomyelitis, hand
M86.35|Chronic multifocal osteomyelitis, pelvic and thigh
M86.36|Chronic multifocal osteomyelitis, lower leg
M86.37|Chronic multifocal osteomyelitis, ankle and foot
M86.38|Chronic multifocal osteomyelitis, other site
M86.39|Chronic multifocal osteomyelitis, site unspecified
M86.4|Chronic osteomyelitis with draining sinus
M86.40|Chronic osteomyelitis with draining sinus, multiple sites
M86.41|Chronic osteomyelitis with draining sinus, shoulder region
M86.42|Chronic osteomyelitis with draining sinus, upper arm
M86.43|Chronic osteomyelitis with draining sinus, forearm
M86.44|Chronic osteomyelitis with draining sinus, hand
M86.45|Chronic osteomyelitis with draining sinus, pelvic and thigh
M86.46|Chronic osteomyelitis with draining sinus, lower leg
M86.47|Chronic osteomyelitis with draining sinus, ankle and foot
M86.48|Chronic osteomyelitis with draining sinus, other site
M86.49|Chronic osteomyelitis with draining sinus, site unspecified
M86.5|Other chronic haematogenous osteomyelitis
M86.50|Other chronic haematogenous osteomyelitis, multiple sites
M86.51|Other chronic haematogenous osteomyelitis, shoulder region
M86.52|Other chronic haematogenous osteomyelitis, upper arm
M86.53|Other chronic haematogenous osteomyelitis, forearm
M86.54|Other chronic haematogenous osteomyelitis, hand
M86.55|Other chronic haematogenous osteomyelitis, pelvic and thigh
M86.56|Other chronic haematogenous osteomyelitis, lower leg
M86.57|Other chronic haematogenous osteomyelitis, ankle and foot
M86.58|Other chronic haematogenous osteomyelitis, other site
M86.59|Other chronic haematogenous osteomyelitis, site unspecified
M86.6|Other chronic osteomyelitis
M86.60|Other chronic osteomyelitis, multiple sites
M86.61|Other chronic osteomyelitis, shoulder region
M86.62|Other chronic osteomyelitis, upper arm
M86.63|Other chronic osteomyelitis, forearm
M86.64|Other chronic osteomyelitis, hand
M86.65|Other chronic osteomyelitis, pelvic and thigh
M86.66|Other chronic osteomyelitis, lower leg
M86.67|Other chronic osteomyelitis, ankle and foot
M86.68|Other chronic osteomyelitis, other site
M86.69|Other chronic osteomyelitis, site unspecified
M86.8|Other osteomyelitis
M86.80|Other osteomyelitis, multiple sites
M86.81|Other osteomyelitis, shoulder region
M86.82|Other osteomyelitis, upper arm
M86.83|Other osteomyelitis, forearm
M86.84|Other osteomyelitis, hand
M86.85|Other osteomyelitis, pelvic and thigh
M86.86|Other osteomyelitis, lower leg
M86.87|Other osteomyelitis, ankle and foot
M86.88|Other osteomyelitis, other site
M86.89|Other osteomyelitis, site unspecified
M86.9|Osteomyelitis, unspecified
M86.90|Osteomyelitis, unspecified, multiple sites
M86.91|Osteomyelitis, unspecified, shoulder region
M86.92|Osteomyelitis, unspecified, upper arm
M86.93|Osteomyelitis, unspecified, forearm
M86.94|Osteomyelitis, unspecified, hand
M86.95|Osteomyelitis, unspecified, pelvic and thigh
M86.96|Osteomyelitis, unspecified, lower leg
M86.97|Osteomyelitis, unspecified, ankle and foot
M86.98|Osteomyelitis, unspecified, other site
M86.99|Osteomyelitis, unspecified, site unspecified
M87|Osteonecrosis
M87.0|Idiopathic aseptic necrosis of bone
M87.00|Idiopathic aseptic necrosis of bone, multiple sites
M87.01|Idiopathic aseptic necrosis of bone, shoulder region
M87.02|Idiopathic aseptic necrosis of bone, upper arm
M87.03|Idiopathic aseptic necrosis of bone, forearm
M87.04|Idiopathic aseptic necrosis of bone, hand
M87.05|Idiopathic aseptic necrosis of bone, pelvic and thigh
M87.06|Idiopathic aseptic necrosis of bone, lower leg
M87.07|Idiopathic aseptic necrosis of bone, ankle and foot
M87.08|Idiopathic aseptic necrosis of bone, other site
M87.09|Idiopathic aseptic necrosis of bone, site unspecified
M87.1|Osteonecrosis due to drugs
M87.10|Osteonecrosis due to drugs, multiple sites
M87.11|Osteonecrosis due to drugs, shoulder region
M87.12|Osteonecrosis due to drugs, upper arm
M87.13|Osteonecrosis due to drugs, forearm
M87.14|Osteonecrosis due to drugs, hand
M87.15|Osteonecrosis due to drugs, pelvic and thigh
M87.16|Osteonecrosis due to drugs, lower leg
M87.17|Osteonecrosis due to drugs, ankle and foot
M87.18|Osteonecrosis due to drugs, other site
M87.19|Osteonecrosis due to drugs, site unspecified
M87.2|Osteonecrosis due to previous trauma
M87.20|Osteonecrosis due to previous trauma, multiple sites
M87.21|Osteonecrosis due to previous trauma, shoulder region
M87.22|Osteonecrosis due to previous trauma, upper arm
M87.23|Osteonecrosis due to previous trauma, forearm
M87.24|Osteonecrosis due to previous trauma, hand
M87.25|Osteonecrosis due to previous trauma, pelvic and thigh
M87.26|Osteonecrosis due to previous trauma, lower leg
M87.27|Osteonecrosis due to previous trauma, ankle and foot
M87.28|Osteonecrosis due to previous trauma, other site
M87.29|Osteonecrosis due to previous trauma, site unspecified
M87.3|Other secondary osteonecrosis
M87.30|Other secondary osteonecrosis, multiple sites
M87.31|Other secondary osteonecrosis, shoulder region
M87.32|Other secondary osteonecrosis, upper arm
M87.33|Other secondary osteonecrosis, forearm
M87.34|Other secondary osteonecrosis, hand
M87.35|Other secondary osteonecrosis, pelvic and thigh
M87.36|Other secondary osteonecrosis, lower leg
M87.37|Other secondary osteonecrosis, ankle and foot
M87.38|Other secondary osteonecrosis, other site
M87.39|Other secondary osteonecrosis, site unspecified
M87.8|Other osteonecrosis
M87.80|Other osteonecrosis, multiple sites
M87.81|Other osteonecrosis, shoulder region
M87.82|Other osteonecrosis, upper arm
M87.83|Other osteonecrosis, forearm
M87.84|Other osteonecrosis, hand
M87.85|Other osteonecrosis, pelvic and thigh
M87.86|Other osteonecrosis, lower leg
M87.87|Other osteonecrosis, ankle and foot
M87.88|Other osteonecrosis, other site
M87.89|Other osteonecrosis, site unspecified
M87.9|Osteonecrosis, unspecified
M87.90|Osteonecrosis, unspecified, multiple sites
M87.91|Osteonecrosis, unspecified, shoulder region
M87.92|Osteonecrosis, unspecified, upper arm
M87.93|Osteonecrosis, unspecified, forearm
M87.94|Osteonecrosis, unspecified, hand
M87.95|Osteonecrosis, unspecified, pelvic and thigh
M87.96|Osteonecrosis, unspecified, lower leg
M87.97|Osteonecrosis, unspecified, ankle and foot
M87.98|Osteonecrosis, unspecified, other site
M87.99|Osteonecrosis, unspecified, site unspecified
M88|Paget disease of bone [osteitis deformans]
M88.0|Paget's disease of skull
M88.09|Paget's disease of skull, site unspecified
M88.8|Paget's disease of other bones
M88.80|Paget's disease of other bones, multiple sites
M88.81|Paget's disease of other bones, shoulder region
M88.82|Paget's disease of other bones, upper arm
M88.83|Paget's disease of other bones, forearm
M88.84|Paget's disease of other bones, hand
M88.85|Paget's disease of other bones, pelvic and thigh
M88.86|Paget's disease of other bones, lower leg
M88.87|Paget's disease of other bones, ankle and foot
M88.88|Paget's disease of other bones, other site
M88.89|Paget's disease of other bones, site unspecified
M88.9|Paget's disease of bone, unspecified
M88.90|Paget's disease of bone, unspecified, multiple sites
M88.91|Paget's disease of bone, unspecified, shoulder region
M88.92|Paget's disease of bone, unspecified, upper arm
M88.93|Paget's disease of bone, unspecified, forearm
M88.94|Paget's disease of bone, unspecified, hand
M88.95|Paget's disease of bone, unspecified, pelvic and thigh
M88.96|Paget's disease of bone, unspecified, lower leg
M88.97|Paget's disease of bone, unspecified, ankle and foot
M88.98|Paget's disease of bone, unspecified, other site
M88.99|Paget's disease of bone, unspecified, site unspecified
M89|Other disorders of bone
M89.0|Algoneurodystrophy
M89.00|Algoneurodystrophy, multiple sites
M89.01|Algoneurodystrophy, shoulder region
M89.02|Algoneurodystrophy, upper arm
M89.03|Algoneurodystrophy, forearm
M89.04|Algoneurodystrophy, hand
M89.05|Algoneurodystrophy, pelvic and thigh
M89.06|Algoneurodystrophy, lower leg
M89.07|Algoneurodystrophy, ankle and foot
M89.08|Algoneurodystrophy, other site
M89.09|Algoneurodystrophy, site unspecified
M89.1|Epiphyseal arrest
M89.10|Epiphyseal arrest, multiple sites
M89.11|Epiphyseal arrest, shoulder region
M89.12|Epiphyseal arrest, upper arm
M89.13|Epiphyseal arrest, forearm
M89.14|Epiphyseal arrest, hand
M89.15|Epiphyseal arrest, pelvic and thigh
M89.16|Epiphyseal arrest, lower leg
M89.17|Epiphyseal arrest, ankle and foot
M89.18|Epiphyseal arrest, other site
M89.19|Epiphyseal arrest, site unspecified
M89.2|Other disorders of bone development and growth
M89.20|Other disorders of bone development and growth, multiple sites
M89.21|Other disorders of bone development and growth, shoulder region
M89.22|Other disorders of bone development and growth, upper arm
M89.23|Other disorders of bone development and growth, forearm
M89.24|Other disorders of bone development and growth, hand
M89.25|Other disorders of bone development and growth, pelvic and thigh
M89.26|Other disorders of bone development and growth, lower leg
M89.27|Other disorders of bone development and growth, ankle and foot
M89.28|Other disorders of bone development and growth, other site
M89.29|Other disorders of bone development and growth, site unspecified
M89.3|Hypertrophy of bone
M89.30|Hypertrophy of bone, multiple sites
M89.31|Hypertrophy of bone, shoulder region
M89.32|Hypertrophy of bone, upper arm
M89.33|Hypertrophy of bone, forearm
M89.34|Hypertrophy of bone, hand
M89.35|Hypertrophy of bone, pelvic and thigh
M89.36|Hypertrophy of bone, lower leg
M89.37|Hypertrophy of bone, ankle and foot
M89.38|Hypertrophy of bone, other site
M89.39|Hypertrophy of bone, site unspecified
M89.4|Other hypertrophic osteoarthropathy
M89.40|Other hypertrophic osteoarthropathy, multiple sites
M89.41|Other hypertrophic osteoarthropathy, shoulder region
M89.42|Other hypertrophic osteoarthropathy, upper arm
M89.43|Other hypertrophic osteoarthropathy, forearm
M89.44|Other hypertrophic osteoarthropathy, hand
M89.45|Other hypertrophic osteoarthropathy, pelvic and thigh
M89.46|Other hypertrophic osteoarthropathy, lower leg
M89.47|Other hypertrophic osteoarthropathy, ankle and foot
M89.48|Other hypertrophic osteoarthropathy, other site
M89.49|Other hypertrophic osteoarthropathy, site unspecified
M89.5|Osteolysis
M89.50|Osteolysis, multiple sites
M89.51|Osteolysis, shoulder region
M89.52|Osteolysis, upper arm
M89.53|Osteolysis, forearm
M89.54|Osteolysis, hand
M89.55|Osteolysis, pelvic and thigh
M89.56|Osteolysis, lower leg
M89.57|Osteolysis, ankle and foot
M89.58|Osteolysis, other site
M89.59|Osteolysis, site unspecified
M89.6|Osteopathy after poliomyelitis
M89.60|Osteopathy after poliomyelitis, multiple sites
M89.61|Osteopathy after poliomyelitis, shoulder region
M89.62|Osteopathy after poliomyelitis, upper arm
M89.63|Osteopathy after poliomyelitis, forearm
M89.64|Osteopathy after poliomyelitis, hand
M89.65|Osteopathy after poliomyelitis, pelvic and thigh
M89.66|Osteopathy after poliomyelitis, lower leg
M89.67|Osteopathy after poliomyelitis, ankle and foot
M89.68|Osteopathy after poliomyelitis, other site
M89.69|Osteopathy after poliomyelitis, site unspecified
M89.8|Other specified disorders of bone
M89.80|Other specified disorders of bone, multiple sites
M89.81|Other specified disorders of bone, shoulder region
M89.82|Other specified disorders of bone, upper arm
M89.83|Other specified disorders of bone, forearm
M89.84|Other specified disorders of bone, hand
M89.85|Other specified disorders of bone, pelvic and thigh
M89.86|Other specified disorders of bone, lower leg
M89.87|Other specified disorders of bone, ankle and foot
M89.88|Other specified disorders of bone, other site
M89.89|Other specified disorders of bone, site unspecified
M89.9|Disorder of bone, unspecified
M89.90|Disorder of bone, unspecified, multiple sites
M89.91|Disorder of bone, unspecified, shoulder region
M89.92|Disorder of bone, unspecified, upper arm
M89.93|Disorder of bone, unspecified, forearm
M89.94|Disorder of bone, unspecified, hand
M89.95|Disorder of bone, unspecified, pelvic and thigh
M89.96|Disorder of bone, unspecified, lower leg
M89.97|Disorder of bone, unspecified, ankle and foot
M89.98|Disorder of bone, unspecified, other site
M89.99|Disorder of bone, unspecified, site unspecified
M90|Osteopathies in diseases classified elsewhere
M90.0|Tuberculosis of bone
M90.00|Tuberculosis of bone, multiple sites
M90.01|Tuberculosis of bone, shoulder region
M90.02|Tuberculosis of bone, upper arm
M90.03|Tuberculosis of bone, forearm
M90.04|Tuberculosis of bone, hand
M90.05|Tuberculosis of bone, pelvic and thigh
M90.06|Tuberculosis of bone, lower leg
M90.07|Tuberculosis of bone, ankle and foot
M90.08|Tuberculosis of bone, other site
M90.09|Tuberculosis of bone, site unspecified
M90.1|Periostitis in other infectious diseases classified elsewhere
M90.10|Periostitis in other infectious diseases classified elsewhere, multiple sites
M90.11|Periostitis in other infectious diseases classified elsewhere, shoulder region
M90.12|Periostitis in other infectious diseases classified elsewhere, upper arm
M90.13|Periostitis in other infectious diseases classified elsewhere, forearm
M90.14|Periostitis in other infectious diseases classified elsewhere, hand
M90.15|Periostitis in other infectious diseases classified elsewhere, pelvic and thigh
M90.16|Periostitis in other infectious diseases classified elsewhere, lower leg
M90.17|Periostitis in other infectious diseases classified elsewhere, ankle and foot
M90.18|Periostitis in other infectious diseases classified elsewhere, other site
M90.19|Periostitis in other infectious diseases classified elsewhere, site unspecified
M90.2|Osteopathy in other infectious diseases classified elsewhere
M90.20|Osteopathy in other infectious diseases classified elsewhere, multiple sites
M90.21|Osteopathy in other infectious diseases classified elsewhere, shoulder region
M90.22|Osteopathy in other infectious diseases classified elsewhere, upper arm
M90.23|Osteopathy in other infectious diseases classified elsewhere, forearm
M90.24|Osteopathy in other infectious diseases classified elsewhere, hand
M90.25|Osteopathy in other infectious diseases classified elsewhere, pelvic and thigh
M90.26|Osteopathy in other infectious diseases classified elsewhere, lower leg
M90.27|Osteopathy in other infectious diseases classified elsewhere, ankle and foot
M90.28|Osteopathy in other infectious diseases classified elsewhere, other site
M90.29|Osteopathy in other infectious diseases classified elsewhere, site unspecified
M90.3|Osteonecrosis in caisson disease
M90.30|Osteonecrosis in caisson disease, multiple sites
M90.31|Osteonecrosis in caisson disease, shoulder region
M90.32|Osteonecrosis in caisson disease, upper arm
M90.33|Osteonecrosis in caisson disease, forearm
M90.34|Osteonecrosis in caisson disease, hand
M90.35|Osteonecrosis in caisson disease, pelvic and thigh
M90.36|Osteonecrosis in caisson disease, lower leg
M90.37|Osteonecrosis in caisson disease, ankle and foot
M90.38|Osteonecrosis in caisson disease, other site
M90.39|Osteonecrosis in caisson disease, site unspecified
M90.4|Osteonecrosis due to haemoglobinopathy
M90.40|Osteonecrosis due to haemoglobinopathy, multiple sites
M90.41|Osteonecrosis due to haemoglobinopathy, shoulder region
M90.42|Osteonecrosis due to haemoglobinopathy, upper arm
M90.43|Osteonecrosis due to haemoglobinopathy, forearm
M90.44|Osteonecrosis due to haemoglobinopathy, hand
M90.45|Osteonecrosis due to haemoglobinopathy, pelvic and thigh
M90.46|Osteonecrosis due to haemoglobinopathy, lower leg
M90.47|Osteonecrosis due to haemoglobinopathy, ankle and foot
M90.48|Osteonecrosis due to haemoglobinopathy, other site
M90.49|Osteonecrosis due to haemoglobinopathy, site unspecified
M90.5|Osteonecrosis in other diseases classified elsewhere
M90.50|Osteonecrosis in other diseases classified elsewhere, multiple sites
M90.51|Osteonecrosis in other diseases classified elsewhere, shoulder region
M90.52|Osteonecrosis in other diseases classified elsewhere, upper arm
M90.53|Osteonecrosis in other diseases classified elsewhere, forearm
M90.54|Osteonecrosis in other diseases classified elsewhere, hand
M90.55|Osteonecrosis in other diseases classified elsewhere, pelvic and thigh
M90.56|Osteonecrosis in other diseases classified elsewhere, lower leg
M90.57|Osteonecrosis in other diseases classified elsewhere, ankle and foot
M90.58|Osteonecrosis in other diseases classified elsewhere, other site
M90.59|Osteonecrosis in other diseases classified elsewhere, site unspecified
M90.6|Osteitis deformans in neoplastic disease
M90.60|Osteitis deformans in neoplastic disease, multiple sites
M90.61|Osteitis deformans in neoplastic disease, shoulder region
M90.62|Osteitis deformans in neoplastic disease, upper arm
M90.63|Osteitis deformans in neoplastic disease, forearm
M90.64|Osteitis deformans in neoplastic disease, hand
M90.65|Osteitis deformans in neoplastic disease, pelvic and thigh
M90.66|Osteitis deformans in neoplastic disease, lower leg
M90.67|Osteitis deformans in neoplastic disease, ankle and foot
M90.68|Osteitis deformans in neoplastic disease, other site
M90.69|Osteitis deformans in neoplastic disease, site unspecified
M90.7|Fracture of bone in neoplastic disease
M90.70|Fracture of bone in neoplastic disease, multiple sites
M90.71|Fracture of bone in neoplastic disease, shoulder region
M90.72|Fracture of bone in neoplastic disease, upper arm
M90.73|Fracture of bone in neoplastic disease, forearm
M90.74|Fracture of bone in neoplastic disease, hand
M90.75|Fracture of bone in neoplastic disease, pelvic and thigh
M90.76|Fracture of bone in neoplastic disease, lower leg
M90.77|Fracture of bone in neoplastic disease, ankle and foot
M90.78|Fracture of bone in neoplastic disease, other site
M90.79|Fracture of bone in neoplastic disease, site unspecified
M90.8|Osteopathy in other diseases classified elsewhere
M90.80|Osteopathy in other diseases classified elsewhere, multiple sites
M90.81|Osteopathy in other diseases classified elsewhere, shoulder region
M90.82|Osteopathy in other diseases classified elsewhere, upper arm
M90.83|Osteopathy in other diseases classified elsewhere, forearm
M90.84|Osteopathy in other diseases classified elsewhere, hand
M90.85|Osteopathy in other diseases classified elsewhere, pelvic and thigh
M90.86|Osteopathy in other diseases classified elsewhere, lower leg
M90.87|Osteopathy in other diseases classified elsewhere, ankle and foot
M90.88|Osteopathy in other diseases classified elsewhere, other site
M90.89|Osteopathy in other diseases classified elsewhere, site unspecified
M91|Juvenile osteochondrosis of hip and pelvis
M91.0|Juvenile osteochondrosis of pelvis
M91.00|Juvenile osteochondrosis of pelvis, multiple sites
M91.01|Juvenile osteochondrosis of pelvis, shoulder region
M91.02|Juvenile osteochondrosis of pelvis, upper arm
M91.03|Juvenile osteochondrosis of pelvis, forearm
M91.04|Juvenile osteochondrosis of pelvis, hand
M91.05|Juvenile osteochondrosis of pelvis, pelvic region and thigh
M91.06|Juvenile osteochondrosis of pelvis, lower leg
M91.07|Juvenile osteochondrosis of pelvis, ankle and foot
M91.08|Juvenile osteochondrosis of pelvis, other
M91.09|Juvenile osteochondrosis of pelvis, site unspecified
M91.1|Juv osteochondrosis head of femur [legg-calv
M91.10|Juv osteochondrosis head of femur [legg-calv
M91.11|Juv osteochondrosis head of femur [legg-calv
M91.12|Juv osteochondrosis head of femur [legg-calv
M91.13|Juv osteochondrosis head of femur [legg-calv
M91.14|Juv osteochondrosis head of femur [legg-calv
M91.15|Juv osteochondrosis head of femur [legg-calv
M91.16|Juv osteochondrosis head of femur [legg-calv
M91.17|Juv osteochondrosis head of femur [legg-calv
M91.18|Juv osteochondrosis head of femur [legg-calv
M91.19|Juv osteochondrosis head of femur [legg-calv
M91.2|Coxa plana
M91.20|Coxa plana, multiple sites
M91.21|Coxa plana, shoulder region
M91.22|Coxa plana, upper arm
M91.23|Coxa plana, forearm
M91.24|Coxa plana, hand
M91.25|Coxa plana, pelvic region and thigh
M91.26|Coxa plana, lower leg
M91.27|Coxa plana, ankle and foot
M91.28|Coxa plana, other
M91.29|Coxa plana, site unspecified
M91.3|Pseudocoxalgia
M91.30|Pseudocoxalgia, multiple sites
M91.31|Pseudocoxalgia, shoulder region
M91.32|Pseudocoxalgia, upper arm
M91.33|Pseudocoxalgia, forearm
M91.34|Pseudocoxalgia, hand
M91.35|Pseudocoxalgia, pelvic region and thigh
M91.36|Pseudocoxalgia, lower leg
M91.37|Pseudocoxalgia, ankle and foot
M91.38|Pseudocoxalgia, other
M91.39|Pseudocoxalgia, site unspecified
M91.8|Other juvenile osteochondrosis of hip and pelvis
M91.80|Other juvenile osteochondrosis of hip and pelvis, multiple sites
M91.81|Other juvenile osteochondrosis of hip and pelvis, shoulder region
M91.82|Other juvenile osteochondrosis of hip and pelvis, upper arm
M91.83|Other juvenile osteochondrosis of hip and pelvis, forearm
M91.84|Other juvenile osteochondrosis of hip and pelvis, hand
M91.85|Other juvenile osteochondrosis of hip and pelvis, pelvic region and thigh
M91.86|Other juvenile osteochondrosis of hip and pelvis, lower leg
M91.87|Other juvenile osteochondrosis of hip and pelvis, ankle and foot
M91.88|Other juvenile osteochondrosis of hip and pelvis, other
M91.89|Other juvenile osteochondrosis of hip and pelvis, site unspecified
M91.9|Juvenile osteochondrosis of hip and pelvis, unspecified
M91.90|Juvenile osteochondrosis of hip and pelvis, unspecified, multiple sites
M91.91|Juvenile osteochondrosis of hip and pelvis, unspecified, shoulder region
M91.92|Juvenile osteochondrosis of hip and pelvis, unspecified, upper arm
M91.93|Juvenile osteochondrosis of hip and pelvis, unspecified, forearm
M91.94|Juvenile osteochondrosis of hip and pelvis, unspecified, hand
M91.95|Juvenile osteochondrosis of hip and pelvis, unspecified, pelvic region and thigh
M91.96|Juvenile osteochondrosis of hip and pelvis, unspecified, lower leg
M91.97|Juvenile osteochondrosis of hip and pelvis, unspecified, ankle and foot
M91.98|Juvenile osteochondrosis of hip and pelvis, unspecified, other
M91.99|Juvenile osteochondrosis of hip and pelvis, unspecified, site unspecified
M92|Other juvenile osteochondrosis
M92.0|Juvenile osteochondrosis of humerus
M92.00|Juvenile osteochondrosis of humerus, multiple sites
M92.01|Juvenile osteochondrosis of humerus, shoulder region
M92.02|Juvenile osteochondrosis of humerus, upper arm
M92.03|Juvenile osteochondrosis of humerus, forearm
M92.04|Juvenile osteochondrosis of humerus, hand
M92.05|Juvenile osteochondrosis of humerus, pelvic region and thigh
M92.06|Juvenile osteochondrosis of humerus, lower leg
M92.07|Juvenile osteochondrosis of humerus, ankle and foot
M92.08|Juvenile osteochondrosis of humerus, other
M92.09|Juvenile osteochondrosis of humerus, site unspecified
M92.1|Juvenile osteochondrosis of radius and ulna
M92.10|Juvenile osteochondrosis of radius and ulna, multiple sites
M92.11|Juvenile osteochondrosis of radius and ulna, shoulder region
M92.12|Juvenile osteochondrosis of radius and ulna, upper arm
M92.13|Juvenile osteochondrosis of radius and ulna, forearm
M92.14|Juvenile osteochondrosis of radius and ulna, hand
M92.15|Juvenile osteochondrosis of radius and ulna, pelvic region and thigh
M92.16|Juvenile osteochondrosis of radius and ulna, lower leg
M92.17|Juvenile osteochondrosis of radius and ulna, ankle and foot
M92.18|Juvenile osteochondrosis of radius and ulna, other
M92.19|Juvenile osteochondrosis of radius and ulna, site unspecified
M92.2|Juvenile osteochondrosis of hand
M92.20|Juvenile osteochondrosis of hand, multiple sites
M92.21|Juvenile osteochondrosis of hand, shoulder region
M92.22|Juvenile osteochondrosis of hand, upper arm
M92.23|Juvenile osteochondrosis of hand, forearm
M92.24|Juvenile osteochondrosis of hand, hand
M92.25|Juvenile osteochondrosis of hand, pelvic region and thigh
M92.26|Juvenile osteochondrosis of hand, lower leg
M92.27|Juvenile osteochondrosis of hand, ankle and foot
M92.28|Juvenile osteochondrosis of hand, other
M92.29|Juvenile osteochondrosis of hand, site unspecified
M92.3|Other juvenile osteochondrosis of upper limb
M92.30|Other juvenile osteochondrosis of upper limb, multiple sites
M92.31|Other juvenile osteochondrosis of upper limb, shoulder region
M92.32|Other juvenile osteochondrosis of upper limb, upper arm
M92.33|Other juvenile osteochondrosis of upper limb, forearm
M92.34|Other juvenile osteochondrosis of upper limb, hand
M92.35|Other juvenile osteochondrosis of upper limb, pelvic region and thigh
M92.36|Other juvenile osteochondrosis of upper limb, lower leg
M92.37|Other juvenile osteochondrosis of upper limb, ankle and foot
M92.38|Other juvenile osteochondrosis of upper limb, other
M92.39|Other juvenile osteochondrosis of upper limb, site unspecified
M92.4|Juvenile osteochondrosis of patella
M92.40|Juvenile osteochondrosis of patella, multiple sites
M92.41|Juvenile osteochondrosis of patella, shoulder region
M92.42|Juvenile osteochondrosis of patella, upper arm
M92.43|Juvenile osteochondrosis of patella, forearm
M92.44|Juvenile osteochondrosis of patella, hand
M92.45|Juvenile osteochondrosis of patella, pelvic region and thigh
M92.46|Juvenile osteochondrosis of patella, lower leg
M92.47|Juvenile osteochondrosis of patella, ankle and foot
M92.48|Juvenile osteochondrosis of patella, other
M92.49|Juvenile osteochondrosis of patella, site unspecified
M92.5|Juvenile osteochondrosis of tibia and fibula
M92.50|Juvenile osteochondrosis of tibia and fibula, multiple sites
M92.51|Juvenile osteochondrosis of tibia and fibula, shoulder region
M92.52|Juvenile osteochondrosis of tibia and fibula, upper arm
M92.53|Juvenile osteochondrosis of tibia and fibula, forearm
M92.54|Juvenile osteochondrosis of tibia and fibula, hand
M92.55|Juvenile osteochondrosis of tibia and fibula, pelvic region and thigh
M92.56|Juvenile osteochondrosis of tibia and fibula, lower leg
M92.57|Juvenile osteochondrosis of tibia and fibula, ankle and foot
M92.58|Juvenile osteochondrosis of tibia and fibula, other
M92.59|Juvenile osteochondrosis of tibia and fibula, site unspecified
M92.6|Juvenile osteochondrosis of tarsus
M92.60|Juvenile osteochondrosis of tarsus, multiple sites
M92.61|Juvenile osteochondrosis of tarsus, shoulder region
M92.62|Juvenile osteochondrosis of tarsus, upper arm
M92.63|Juvenile osteochondrosis of tarsus, forearm
M92.64|Juvenile osteochondrosis of tarsus, hand
M92.65|Juvenile osteochondrosis of tarsus, pelvic region and thigh
M92.66|Juvenile osteochondrosis of tarsus, lower leg
M92.67|Juvenile osteochondrosis of tarsus, ankle and foot
M92.68|Juvenile osteochondrosis of tarsus, other
M92.69|Juvenile osteochondrosis of tarsus, site unspecified
M92.7|Juvenile osteochondrosis of metatarsus
M92.70|Juvenile osteochondrosis of metatarsus, multiple sites
M92.71|Juvenile osteochondrosis of metatarsus, shoulder region
M92.72|Juvenile osteochondrosis of metatarsus, upper arm
M92.73|Juvenile osteochondrosis of metatarsus, forearm
M92.74|Juvenile osteochondrosis of metatarsus, hand
M92.75|Juvenile osteochondrosis of metatarsus, pelvic region and thigh
M92.76|Juvenile osteochondrosis of metatarsus, lower leg
M92.77|Juvenile osteochondrosis of metatarsus, ankle and foot
M92.78|Juvenile osteochondrosis of metatarsus, other
M92.79|Juvenile osteochondrosis of metatarsus, site unspecified
M92.8|Other specified juvenile osteochondrosis
M92.80|Other specified juvenile osteochondrosis, multiple sites
M92.81|Other specified juvenile osteochondrosis, shoulder region
M92.82|Other specified juvenile osteochondrosis, upper arm
M92.83|Other specified juvenile osteochondrosis, forearm
M92.84|Other specified juvenile osteochondrosis, hand
M92.85|Other specified juvenile osteochondrosis, pelvic region and thigh
M92.86|Other specified juvenile osteochondrosis, lower leg
M92.87|Other specified juvenile osteochondrosis, ankle and foot
M92.88|Other specified juvenile osteochondrosis, other
M92.89|Other specified juvenile osteochondrosis, site unspecified
M92.9|Juvenile osteochondrosis, unspecified
M92.90|Juvenile osteochondrosis, unspecified, multiple sites
M92.91|Juvenile osteochondrosis, unspecified, shoulder region
M92.92|Juvenile osteochondrosis, unspecified, upper arm
M92.93|Juvenile osteochondrosis, unspecified, forearm
M92.94|Juvenile osteochondrosis, unspecified, hand
M92.95|Juvenile osteochondrosis, unspecified, pelvic region and thigh
M92.96|Juvenile osteochondrosis, unspecified, lower leg
M92.97|Juvenile osteochondrosis, unspecified, ankle and foot
M92.98|Juvenile osteochondrosis, unspecified, other
M92.99|Juvenile osteochondrosis, unspecified, site unspecified
M93|Other osteochondropathies
M93.0|Slipped upper femoral epiphysis (nontraumatic)
M93.00|Slipped upper femoral epiphysis (nontraumatic), multiple sites
M93.01|Slipped upper femoral epiphysis (nontraumatic), shoulder region
M93.02|Slipped upper femoral epiphysis (nontraumatic), upper arm
M93.03|Slipped upper femoral epiphysis (nontraumatic), forearm
M93.04|Slipped upper femoral epiphysis (nontraumatic), hand
M93.05|Slipped upper femoral epiphysis (nontraumatic), pelvic region and thigh
M93.06|Slipped upper femoral epiphysis (nontraumatic), lower leg
M93.07|Slipped upper femoral epiphysis (nontraumatic), ankle and foot
M93.08|Slipped upper femoral epiphysis (nontraumatic), other
M93.09|Slipped upper femoral epiphysis (nontraumatic), site unspecified
M93.1|Kienbock disease of adults
M93.10|Kienbock disease of adults, multiple sites
M93.11|Kienbock disease of adults, shoulder region
M93.12|Kienbock disease of adults, upper arm
M93.13|Kienbock disease of adults, forearm
M93.14|Kienbock disease of adults, hand
M93.15|Kienbock disease of adults, pelvic region and thigh
M93.16|Kienbock disease of adults, lower leg
M93.17|Kienbock disease of adults, ankle and foot
M93.18|Kienbock disease of adults, other
M93.19|Kienbock disease of adults, site unspecified
M93.2|Osteochondritis dissecans
M93.20|Osteochondritis dissecans, multiple sites
M93.21|Osteochondritis dissecans, shoulder region
M93.22|Osteochondritis dissecans, upper arm
M93.23|Osteochondritis dissecans, forearm
M93.24|Osteochondritis dissecans, hand
M93.25|Osteochondritis dissecans, pelvic region and thigh
M93.26|Osteochondritis dissecans, lower leg
M93.27|Osteochondritis dissecans, ankle and foot
M93.28|Osteochondritis dissecans, other
M93.29|Osteochondritis dissecans, site unspecified
M93.8|Other specified osteochondropathies
M93.80|Other specified osteochondropathies, multiple sites
M93.81|Other specified osteochondropathies, shoulder region
M93.82|Other specified osteochondropathies, upper arm
M93.83|Other specified osteochondropathies, forearm
M93.84|Other specified osteochondropathies, hand
M93.85|Other specified osteochondropathies, pelvic region and thigh
M93.86|Other specified osteochondropathies, lower leg
M93.87|Other specified osteochondropathies, ankle and foot
M93.88|Other specified osteochondropathies, other
M93.89|Other specified osteochondropathies, site unspecified
M93.9|Osteochondropathy, unspecified
M93.90|Osteochondropathy, unspecified, multiple sites
M93.91|Osteochondropathy, unspecified, shoulder region
M93.92|Osteochondropathy, unspecified, upper arm
M93.93|Osteochondropathy, unspecified, forearm
M93.94|Osteochondropathy, unspecified, hand
M93.95|Osteochondropathy, unspecified, pelvic region and thigh
M93.96|Osteochondropathy, unspecified, lower leg
M93.97|Osteochondropathy, unspecified, ankle and foot
M93.98|Osteochondropathy, unspecified, other
M93.99|Osteochondropathy, unspecified, site unspecified
M94|Other disorders of cartilage
M94.0|Chondrocostal junction syndrome [tietze]
M94.00|Chondrocostal junction syndrome [tietze], multiple sites
M94.01|Chondrocostal junction syndrome [tietze], shoulder region
M94.02|Chondrocostal junction syndrome [tietze], upper arm
M94.03|Chondrocostal junction syndrome [tietze], forearm
M94.04|Chondrocostal junction syndrome [tietze], hand
M94.05|Chondrocostal junction syndrome [tietze], pelvic region and thigh
M94.06|Chondrocostal junction syndrome [tietze], lower leg
M94.07|Chondrocostal junction syndrome [tietze], ankle and foot
M94.08|Chondrocostal junction syndrome [tietze], other
M94.09|Chondrocostal junction syndrome [tietze], site unspecified
M94.1|Relapsing polychondritis
M94.10|Relapsing polychondritis, multiple sites
M94.11|Relapsing polychondritis, shoulder region
M94.12|Relapsing polychondritis, upper arm
M94.13|Relapsing polychondritis, forearm
M94.14|Relapsing polychondritis, hand
M94.15|Relapsing polychondritis, pelvic and thigh
M94.16|Relapsing polychondritis, lower leg
M94.17|Relapsing polychondritis, ankle and foot
M94.18|Relapsing polychondritis, other site
M94.19|Relapsing polychondritis, site unspecified
M94.2|Chondromalacia
M94.20|Chondromalacia, multiple sites
M94.21|Chondromalacia, shoulder region
M94.22|Chondromalacia, upper arm
M94.23|Chondromalacia, forearm
M94.24|Chondromalacia, hand
M94.25|Chondromalacia, pelvic and thigh
M94.26|Chondromalacia, lower leg
M94.27|Chondromalacia, ankle and foot
M94.28|Chondromalacia, other site
M94.29|Chondromalacia, site unspecified
M94.3|Chondrolysis
M94.30|Chondrolysis, multiple sites
M94.31|Chondrolysis, shoulder region
M94.32|Chondrolysis, upper arm
M94.33|Chondrolysis, forearm
M94.34|Chondrolysis, hand
M94.35|Chondrolysis, pelvic and thigh
M94.36|Chondrolysis, lower leg
M94.37|Chondrolysis, ankle and foot
M94.38|Chondrolysis, other site
M94.39|Chondrolysis, site unspecified
M94.8|Other specified disorders of cartilage
M94.80|Other specified disorders of cartilage, multiple sites
M94.81|Other specified disorders of cartilage, shoulder region
M94.82|Other specified disorders of cartilage, upper arm
M94.83|Other specified disorders of cartilage, forearm
M94.84|Other specified disorders of cartilage, hand
M94.85|Other specified disorders of cartilage, pelvic and thigh
M94.86|Other specified disorders of cartilage, lower leg
M94.87|Other specified disorders of cartilage, ankle and foot
M94.88|Other specified disorders of cartilage, other site
M94.89|Other specified disorders of cartilage, site unspecified
M94.9|Disorder of cartilage, unspecified
M94.90|Disorder of cartilage, unspecified, multiple sites
M94.91|Disorder of cartilage, unspecified, shoulder region
M94.92|Disorder of cartilage, unspecified, upper arm
M94.93|Disorder of cartilage, unspecified, forearm
M94.94|Disorder of cartilage, unspecified, hand
M94.95|Disorder of cartilage, unspecified, pelvic and thigh
M94.96|Disorder of cartilage, unspecified, lower leg
M94.97|Disorder of cartilage, unspecified, ankle and foot
M94.98|Disorder of cartilage, unspecified, other site
M94.99|Disorder of cartilage, unspecified, site unspecified
M95|Other acquired deformities of musculoskeletal system and connective tissue
M95.0|Acquired deformity of nose
M95.1|Cauliflower ear
M95.2|Other acquired deformity of head
M95.3|Acquired deformity of neck
M95.4|Acquired deformity of chest and rib
M95.5|Acquired deformity of pelvis
M95.8|Other specified acquired deformities of musculoskel sys
M95.9|Acquired deformity of musculoskeletal system, unspecified
M96|Postprocedural musculoskeletal disorders, not elsewhere classified
M96.0|Pseudarthrosis after fusion or arthrodesis
M96.1|Postlaminectomy syndrome, not elsewhere classified
M96.2|Postradiation kyphosis
M96.3|Postlaminectomy kyphosis
M96.4|Postsurgical lordosis
M96.5|Postradiation scoliosis
M96.6|Fract bone fllg ins orthopae implt jnt prosthesis and bone plate
M96.8|Other postprocedural musculoskeletal disorders
M96.9|Postprocedural musculoskeletal disorder, unspecified
M99|Biomechanical lesions, not elsewhere classified
M99.0|Segmental and somatic dysfunction
M99.00|Segmental and somatic dysfunction, head region
M99.01|Segmental and somatic dysfunction, cervical region
M99.02|Segmental and somatic dysfunction , thoracic region
M99.03|Segmental and somatic dysfunction , lumbar region
M99.04|Segmental and somatic dysfunction , sacral region
M99.05|Segmental and somatic dysfunction , pelvic region
M99.06|Segmental and somatic dysfunction , lower extremity
M99.07|Segmental and somatic dysfunction, upper extremity
M99.08|Segmental and somatic dysfunction, rib region
M99.09|Segmental and somatic dysfunction, abdomen region
M99.1|Subluxation complex (vertebral)
M99.10|Subluxation complex (vertebral), head region
M99.11|Subluxation complex (vertebral), cervical region
M99.12|Subluxation complex (vertebral), thoracic region
M99.13|Subluxation complex (vertebral), lumbar region
M99.14|Subluxation complex (vertebral) , sacral region
M99.15|Subluxation complex (vertebral), pelvic region
M99.16|Subluxation complex (vertebral), lower extremity
M99.17|Subluxation complex (vertebral), upper extremity
M99.18|Subluxation complex (vertebral), rib cage
M99.19|Subluxation complex (vertebral), abdomen and other
M99.2|Subluxation stenosis of neural canal
M99.20|Subluxation stenosis of neural canal, head region
M99.21|Subluxation stenosis of neural canal, cervical region
M99.22|Subluxation stenosis of neural canal, thoracic region
M99.23|Subluxation stenosis of neural canal , lumbar region
M99.24|Subluxation stenosis of neural canal , sacral region
M99.25|Subluxation stenosis of neural canal , pelvic region
M99.26|Subluxation stenosis of neural canal , lower extremity
M99.27|Subluxation stenosis of neural canal, upper extremity
M99.28|Subluxation stenosis of neural canal, rib cage
M99.29|Subluxation stenosis of neural canal, abdomen and other
M99.3|Osseous stenosis of neural canal
M99.30|Osseous stenosis of neural canal, head region
M99.31|Osseous stenosis of neural canal, cervical region
M99.32|Osseous stenosis of neural canal , thoracic region
M99.33|Osseous stenosis of neural canal, lumbar region
M99.34|Osseous stenosis of neural canal , sacral region
M99.35|Osseous stenosis of neural canal , pelvic region
M99.36|Osseous stenosis of neural canal , lower extremity
M99.37|Osseous stenosis of neural canal, upper extremity
M99.38|Osseous stenosis of neural canal, rib cage
M99.39|Osseous stenosis of neural canal, abdomen and other
M99.4|Connective tissue stenosis of neural canal
M99.40|Connective tissue stenosis of neural canal, head region
M99.41|Connective tissue stenosis of neural canal, cervical region
M99.42|Connective tissue stenosis of neural canal, thoracic region
M99.43|Connective tissue stenosis of neural canal, lumbar region
M99.44|Connective tissue stenosis of neural canal , sacral region
M99.45|Connective tissue stenosis of neural canal , pelvic region
M99.46|Connective tissue stenosis of neural canal , lower extremity
M99.47|Connective tissue stenosis of neural canal, upper extremity
M99.48|Connective tissue stenosis of neural canal, rib cage
M99.49|Connective tissue stenosis of neural canal, abdomen and other
M99.5|Intervertebral disc stenosis of neural canal , pelvic region
M99.50|Intervertebral disc stenosis of neural canal , pelvic region, head region
M99.51|Intervertebral disc stenosis of neural canal , pelvic region, cervical region
M99.52|Intervertebral disc stenosis of neural canal , pelvic region , thoracic region
M99.53|Intervertebral disc stenosis of neural canal , pelvic region , lumbar region
M99.54|Intervertebral disc stenosis of neural canal , pelvic region , sacral region
M99.55|Intervertebral disc stenosis of neural canal , pelvic region , pelvic region
M99.56|Intervertebral disc stenosis of neural canal , pelvic region , lower extremity
M99.57|Intervertebral disc stenosis of neural canal , pelvic region, upper extremity
M99.58|Intervertebral disc stenosis of neural canal , pelvic region, rib cage
M99.59|Intervertebral disc stenosis of neural canal , pelvic region, abdomen and other
M99.6|Osseous and subluxation stenosis of intervertebral foramina
M99.60|Osseous and subluxation stenosis of intervertebral foramina, head region
M99.61|Osseous and subluxation stenosis of intervertebral foramina, cervical region
M99.62|Osseous and subluxation stenosis of intervertebral foramina , thoracic region
M99.63|Osseous and subluxation stenosis of intervertebral foramina , lumbar region
M99.64|Osseous and subluxation stenosis of intervertebral foramina , sacral region
M99.65|Osseous and subluxation stenosis of intervertebral foramina , pelvic region
M99.66|Osseous and subluxation stenosis of intervertebral foramina , lower extremity
M99.67|Osseous and subluxation stenosis of intervertebral foramina, upper extremity
M99.68|Osseous and subluxation stenosis of intervertebral foramina, rib cage
M99.69|Osseous and subluxation stenosis of intervertebral foramina, abdomen and other
M99.7|Connective tis and disc stenosis of intervertebral foramina
M99.70|Connective tis and disc stenosis of intervertebral foramina, head region
M99.71|Connective tis and disc stenosis of intervertebral foramina, cervical region
M99.72|Connective tis and disc stenosis of intervertebral foramina , thoracic region
M99.73|Connective tis and disc stenosis of intervertebral foramina , lumbar region
M99.74|Connective tis and disc stenosis of intervertebral foramina , sacral region
M99.75|Connective tis and disc stenosis of intervertebral foramina , pelvic region
M99.76|Connective tis and disc stenosis of intervertebral foramina , lower extremity
M99.77|Connective tis and disc stenosis of intervertebral foramina, upper extremity
M99.78|Connective tis and disc stenosis of intervertebral foramina, rib cage
M99.79|Connective tis and disc stenosis of intervertebral foramina, abdomen and other
M99.8|Other biomechanical lesions
M99.80|Other biomechanical lesions, head region
M99.81|Other biomechanical lesions, cervical region
M99.82|Other biomechanical lesions, thoracic region
M99.83|Other biomechanical lesions. lumbar region
M99.84|Other biomechanical lesions, sacral region
M99.85|Other biomechanical lesions, pelvic region
M99.86|Other biomechanical lesions, lower extremity
M99.87|Other biomechanical lesions, upper extremity
M99.88|Other biomechanical lesions, rib region
M99.89|Other biomechanical lesions, abdomen region
M99.9|Biomechanical lesion, unspecified
M99.90|Biomechanical lesion, unspecified, head region
M99.91|Biomechanical lesion, unspecified, cervical region
M99.92|Biomechanical lesion, unspecified, thoracic region
M99.93|Biomechanical lesion, unspecified, lumbar region
M99.94|Biomechanical lesion, unspecified, sacral region
M99.95|Biomechanical lesion, unspecified, pelvic region
M99.96|Biomechanical lesion, unspecified, lower extremity
M99.97|Biomechanical lesion, unspecified, upper extremity
M99.98|Biomechanical lesion, unspecified, rib region
M99.99|Biomechanical lesion, unspecified, abdomen region
N00|Acute nephritic syndrome
N00.0|Acute nephritic syndrome, minor glomerular abnormality
N00.1|Acute nephritic syndrome, focal and segmental glomerular lesions
N00.2|Acute nephritic syndrome, diffuse membranous glomerulonephritis
N00.3|Acute nephritic syndrome, diffuse mesangial proliferative glomerulonephritis
N00.4|Acute nephritic syndrome, diffuse endocapillary proliferative glomerulonephritis
N00.5|Acute nephritic syndrome, diffuse mesangiocapillary glomerulonephritis
N00.6|Acute nephritic syndrome, dense deposit disease
N00.7|Acute nephritic syndrome, diffuse crescentic glomerulonephritis
N00.8|Acute nephritic syndrome, other
N00.9|Acute nephritic syndrome, unspecified
N01|Rapidly progressive nephritic syndrome
N01.0|Rapidly progressive nephritic syndrome, minor glomerular abnormality
N01.1|Rapidly progressive nephritic syndrome, focal and segmental glomerular lesions
N01.2|Rapidly progressive nephritic syndrome, diffuse membranous glomerulonephritis
N01.3|Rapidly progressive nephritic syndrome, diffuse mesangial proliferative glomerulonephritis
N01.4|Rapidly progressive nephritic syndrome, diffuse endocapillary proliferative glomerulonephritis
N01.5|Rapidly progressive nephritic syndrome, diffuse mesangiocapillary glomerulonephritis
N01.6|Rapidly progressive nephritic syndrome, dense deposit disease
N01.7|Rapidly progressive nephritic syndrome, diffuse crescentic glomerulonephritis
N01.8|Rapidly progressive nephritic syndrome, other
N01.9|Rapidly progressive nephritic syndrome, unspecified
N02|Recurrent and persistent haematuria
N02.0|Recurrent and persistent haematuria, minor glomerular abnormality
N02.1|Recurrent and persistent haematuria, focal and segmental glomerular lesions
N02.2|Recurrent and persistent haematuria, diffuse membranous glomerulonephritis
N02.3|Recurrent and persistent haematuria, diffuse mesangial proliferative glomerulonephritis
N02.4|Recurrent and persistent haematuria, diffuse endocapillary proliferative glomerulonephritis
N02.5|Recurrent and persistent haematuria, diffuse mesangiocapillary glomerulonephritis
N02.6|Recurrent and persistent haematuria, dense deposit disease
N02.7|Recurrent and persistent haematuria, diffuse crescentic glomerulonephritis
N02.8|Recurrent and persistent haematuria, other
N02.9|Recurrent and persistent haematuria, unspecified
N03|Chronic nephritic syndrome
N03.0|Chronic nephritic syndrome, minor glomerular abnormality
N03.1|Chronic nephritic syndrome, focal and segmental glomerular lesions
N03.2|Chronic nephritic syndrome, diffuse membranous glomerulonephritis
N03.3|Chronic nephritic syndrome, diffuse mesangial proliferative glomerulonephritis
N03.4|Chronic nephritic syndrome, diffuse endocapillary proliferative glomerulonephritis
N03.5|Chronic nephritic syndrome, diffuse mesangiocapillary glomerulonephritis
N03.6|Chronic nephritic syndrome, dense deposit disease
N03.7|Chronic nephritic syndrome, diffuse crescentic glomerulonephritis
N03.8|Chronic nephritic syndrome, other
N03.9|Chronic nephritic syndrome, unspecified
N04|Nephrotic syndrome
N04.0|Nephrotic syndrome, minor glomerular abnormality
N04.1|Nephrotic syndrome, focal and segmental glomerular lesions
N04.2|Nephrotic syndrome, diffuse membranous glomerulonephritis
N04.3|Nephrotic syndrome, diffuse mesangial proliferative glomerulonephritis
N04.4|Nephrotic syndrome, diffuse endocapillary proliferative glomerulonephritis
N04.5|Nephrotic syndrome, diffuse mesangiocapillary glomerulonephritis
N04.6|Nephrotic syndrome, dense deposit disease
N04.7|Nepthrotic syndrome, diffuse crescentic glomerulonephritis
N04.8|Nephtrotic syndrome, other
N04.9|Nepthrotic syndrome, unspecified
N05|Unspecified nephritic syndrome
N05.0|Unspecified nephritic syndrome, minor glomerular abnormality
N05.1|Unspecified nephritic syndrome, focal and segmental glomerular lesions
N05.2|Unspecified nephritic syndrome, diffuse membranous glomerulonephritis
N05.3|Unspecified nephritic syndrome, diffuse mesangial proliferative glomerulonephritis
N05.4|Unspecified nephritic syndrome, diffuse endocapillary proliferative glomerulonephritis
N05.5|Unspecified nephritic syndrome, diffuse mesangiocapillary glomeru
N05.6|Unspecified nephritic syndrome, dense deposit disease
N05.7|Unspecified nephritic syndrome, diffuse crescentic glomerulonephritis
N05.8|Unspecified nephritic syndrome, other
N05.9|Unspecified nephritic syndrome, unspecified
N06|Isolated proteinuria with specified morphological lesion
N06.0|Isolated proteinuria with specified morphological lesion, minor glomerular abnormality
N06.1|Isolated proteinuria with specified morphological lesion, focal and segmental glomerular lesions
N06.2|Isolated proteinuria with specified morphological lesion, diffuse membranous glomerulonephritis
N06.3|Isolated proteinuria with specified morphological lesion, diffuse mesangial proliferative glomerulonephritis
N06.4|Isolated proteinuria with specified morphological lesion, diffuse endocapillary proliferative glomerulonephritis
N06.5|Isolated proteinuria with specified morphological lesion, diffuse mesangiocapillary glomerulonephritis
N06.6|Isolated proteinuria with specified morphological lesion, dense deposit disease
N06.7|Isolated proteinuria with specified morphological lesion, diffuse crescentic glomerulonephritis
N06.8|Isolated proteinuria with specified morphological lesion, other
N06.9|Isolated proteinuria with specified morphological lesion, unspecified
N07|Hereditary nephropathy, not elsewhere classified
N07.0|Hereditary nephropathy, not elsewhere classified, minor glomerular abnormality
N07.1|Hereditary nephropathy, not elsewhere classified, focal and segmental glomerular lesions
N07.2|Hereditary nephropathy, not elsewhere classified, diffuse membranous glomerulonephritis
N07.3|Hereditary nephropathy, not elsewhere classified, diffuse mesangial proliferative glomerulonephritis
N07.4|Hereditary nephropathy, not elsewhere classified, diffuse endocapillary proliferative glomerulonephritis
N07.5|Hereditary nephropathy, not elsewhere classified, diffuse mesangiocapillary glomerulonephritis
N07.6|Hereditary nephropathy, not elsewhere classified, dense deposit disease
N07.7|Hereditary nephropathy, not elsewhere classified, diffuse crescentic glomerulonephritis
N07.8|Hereditary nephropathy, not elsewhere classified, other
N07.9|Hereditary nephropathy, not elsewhere classified, unspecified
N08|Glomerular disorders in diseases classified elsewhere
N08.0|Glomerular disorder in infectious and parasitic diseases classified elsewhere
N08.1|Glomerular disorders in neoplastic diseases
N08.2|Glomerular disorders in blood diseases and disorders involving the immune mechanism
N08.3|Glomerular disorders in diabetes mellitus
N08.4|Glomerular disorders in other endocrine, nutritional and metabolic diseases
N08.5|Glomerular disorders in systemic connective tissue disorders
N08.8|Glomerular disorders in other diseases classified elsewhere
N10|Acute tubulo-interstitial nephritis
N11|Chronic tubulo-interstitial nephritis
N11.0|Nonobstructive reflux-associated chronic pyelonephritis
N11.1|Chronic obstructive pyelonephritis
N11.8|Other chronic tubulo-interstitial nephritis
N11.9|Chronic tubulo-interstitial nephritis, unspecified
N12|Tubulo-interstitial nephritis not specified as acute or chronic
N13|Obstructive and reflux uropathy
N13.0|Hydronephrosis with ureteropelvic junction obstruction
N13.1|Hydronephrosis with ureteral stricture not elsewhere classified
N13.2|Hydronephrosis with renal and ureteral calculous obstruction
N13.3|Other and unspecified hydronephrosis
N13.4|Hydroureter
N13.5|Kinking and stricture of ureter without hydronephrosis
N13.6|Pyonephrosis
N13.7|Vesicoureteral-reflux-associated uropathy
N13.8|Other obstructive and reflux uropathy
N13.9|Obstructive and reflux uropathy, unspecified
N14|Drug- and heavy-metal-induced tubulo-interstitial and tubular conditions
N14.0|Analgesic nephropathy
N14.1|Nephropathy induced by other drugs, medicaments and biological substances
N14.2|Neuropathy induced by unspecified drug, medicament or biological substance
N14.3|Nephropathy induced by heavy metals
N14.4|Toxic nephropathy, not elsewhere classified
N15|Other renal tubulo-interstitial diseases
N15.0|Balkan nephropathy
N15.1|Renal and perinephric abscess
N15.8|Other specified renal tubulo-interstitial diseases
N15.9|Renal tubulo-interstitial disease, unspecified
N16|Renal tubulo-interstitial disorders in diseases classified elsewhere
N16.0|Renal tubulo-interstital disorders in infectious and parasitic diseases classified elsewhere
N16.1|Renal tubulo-interstitial disorders in neoplastic diseases
N16.2|Renal tubulo-interstitial disorders in blood diseases and disorders involving the immune mechanism
N16.3|Renal tubulo-interstitial disorders in metabolic diseases
N16.4|Renal tubulo-interstitial disorders systemic connective tissue disorders
N16.5|Renal tubulo-interstitial disorders in transplant rejection
N16.8|Renal tubulo-interstitial disorders in other diseases classified elsewhere
N17|Acute renal failure
N17.0|Acute renal failure with tubular necrosis
N17.1|Acute renal failure with acute cortical necrosis
N17.2|Acute renal failure with medullary necrosis
N17.8|Other acute renal failure
N17.9|Acute renal failure, unspecified
N18|Chronic kidney disease
N18.0|End-stage renal disease
N18.1|Chronic kidney disease, stage 1
N18.2|Chronic kidney disease, stage 2
N18.3|Chronic kidney disease, stage 3
N18.4|Chronic kidney disease, stage 4
N18.5|Chronic kidney disease, stage 5
N18.8|Other chronic renal failure
N18.9|Chronic renal failure, unspecified
N19|Unspecified renal failure
N20|Calculus of kidney and ureter
N20.0|Calculus of kidney
N20.1|Calculus of ureter
N20.2|Calculus of kidney with calculus of ureter
N20.9|Urinary calculus, unspecified
N21|Calculus of lower urinary tract
N21.0|Calculus in bladder
N21.1|Calculus in urethra
N21.8|Other lower urinary tract calculus
N21.9|Calculus of lower urinary tract, unspecified
N22|Calculus of urinary tract in diseases classified elsewhere
N22.0|Urinary calculus in schistosomiasis bilharziasis
N22.8|Calculus of urinary tract in other diseases classified elsewhere
N23|Unspecified renal colic
N25|Disorders resulting from impaired renal tubular function
N25.0|Renal osteodystrophy
N25.1|Nephrogenic diabetes insipidus
N25.8|Other disorders resulting from impaired renal tubular function
N25.9|Disorder resulting from impaired renal tubular function, unspecified
N26|Unspecified contracted kidney
N27|Small kidney of unknown cause
N27.0|Small kidney, unilateral
N27.1|Small kidney, bilateral
N27.9|Small kidney, unspecified
N28|Other disorders of kidney and ureter, not elsewhere classified
N28.0|Ischaemia and infarction of kidney
N28.1|Cyst of kidney, acquired
N28.8|Other specified disorders of kidney and ureter
N28.9|Disorder of kidney and ureter, unspecified
N29|Other disorders of kidney and ureter in diseases classified elsewhere
N29.0|Late syphilis of kidney
N29.1|Other disorders of kidney and ureter in infectious and parasitic diseases classified elsewhere
N29.8|Other disorders of kidney and ureter in other diseases classified elsewhere
N30|Cystitis
N30.0|Acute cystitis
N30.1|Interstitial cystitis chronic
N30.2|Other chronic cystitis
N30.3|Trigonitis
N30.4|Irradiation cystitis
N30.8|Other cystitis
N30.9|Cystitis, unspecified
N31|Neuromuscular dysfunction of bladder, not elsewhere classified
N31.0|Uninhibited neuropathic bladder, not elsewhere classified
N31.1|Reflex neuropathic bladder, not elsewhere classified
N31.2|Flaccid neuropathic bladder, not elsewhere classified
N31.8|Other neuromuscular dysfunction of bladder
N31.9|Neuromuscular dysfunction of bladder, unspecified
N32|Other disorders of bladder
N32.0|Bladder-neck obstruction
N32.1|Vesicointestinal fistula
N32.2|Vesical fistula, not elsewhere classified
N32.3|Diverticulum of bladder
N32.4|Rupture of bladder, nontraumatic
N32.8|Other specified disorders of bladder
N32.9|Bladder disorder, unspecified
N33|Bladder disorders in diseases classified elsewhere
N33.0|Tuberculous cystitis
N33.8|Bladder disorders in other diseases classified elsewhere
N34|Urethritis and urethral syndrome
N34.0|Urethral abscess
N34.1|Nonspecific urethritis
N34.2|Other urethritis
N34.3|Urethral syndrome, unspecified
N35|Urethral stricture
N35.0|Post-traumatic urethral stricture
N35.1|Postinfective urethral stricture, not elsewhere classified
N35.8|Other urethral stricture
N35.9|Urethral stricture, unspecified
N36|Other disorders of urethra
N36.0|Urethral fistula
N36.1|Urethral diverticulum
N36.2|Urethral caruncle
N36.3|Prolapsed urethral mucosa
N36.8|Other specified disorders of urethra
N36.9|Urethral disorder, unspecified
N37|Urethral disorders in diseases classified elsewhere
N37.0|Urethritis in diseases classified elsewhere
N37.8|Other urethral disorders in diseases classified elsewhere
N39|Other disorders of urinary system
N39.0|Urinary tract infection, site not specified
N39.1|Persistent proteinuria, unspecified
N39.2|Orthostatic proteinuria, unspecified
N39.3|Stress incontinence
N39.4|Other specified urinary incontinence
N39.8|Other specified disorders of urinary system
N39.9|Disorder of urinary system, unspecified
N40|Hyperplasia of prostate
N41|Inflammatory diseases of prostate
N41.0|Acute prostatitis
N41.1|Chronic prostatitis
N41.2|Abscess of prostate
N41.3|Prostatocystitis
N41.8|Other inflammatory diseases of prostate
N41.9|Inflammatory disease of prostate, unspecified
N42|Other disorders of prostate
N42.0|Calculus of prostate
N42.1|Congestion and haemorrhage of prostate
N42.2|Atrophy of prostate
N42.3|Dysplasia of prostate
N42.8|Other specified disorders of prostate
N42.9|Disorder of prostate, unspecified
N43|Hydrocele and spermatocele
N43.0|Encysted hydrocele
N43.1|Infected hydrocele
N43.2|Other hydrocele
N43.3|Hydrocele, unspecified
N43.4|Spermatocele
N44|Torsion of testis
N45|Orchitis and epididymitis
N45.0|Orchitis, epididymitis and epididymo-orchitis with abscess
N45.9|Orchitis epididymitis and epididymo-orchitis without abscess
N46|Male infertility
N47|Redundant prepuce, phimosis and paraphimosis
N48|Other disorders of penis
N48.0|Leukoplakia of penis
N48.1|Balanoposthitis
N48.2|Other inflammatory disorders of penis
N48.3|Priapism
N48.4|Impotence of organic origin
N48.5|Ulcer of penis
N48.6|Induratio penis plastica
N48.8|Other specified disorders of penis
N48.9|Disorder of penis, unspecified
N49|Inflammatory disorders of male genital organs, not elsewhere classified
N49.0|Inflammatory disorders of seminal vesicle
N49.1|Inflammatory disorders spermatic cord, tunica vaginalis and vas deferens
N49.2|Inflammatory disorders of scrotum
N49.8|Inflammatory disorders of other specified male genital organs
N49.9|Inflammatory disorder of unspecified male genital organ
N50|Other disorders of male genital organs
N50.0|Atrophy of testis
N50.1|Vascular disorders of male genital organs
N50.8|Other specified disorders of male genital organs
N50.9|Disorder of male genital organs, unspecified
N51|Disorders of male genital organs in diseases classified elsewhere
N51.0|Disorders of prostate in diseases classified elsewhere
N51.1|Disorders of testis and epididymis in diseases classified elsewhere
N51.2|Balanitis in diseases classified elsewhere
N51.8|Other disorders of male genital organs in diseases classified elsewhere
N60|Benign mammary dysplasia
N60.0|Solitary cyst of breast
N60.1|Diffuse cystic mastopathy
N60.2|Fibroadenosis of breast
N60.3|Fibrosclerosis of breast
N60.4|Mammary duct ectasia
N60.8|Other benign mammary dysplasias
N60.9|Benign mammary dysplasia, unspecified
N61|Inflammatory disorders of breast
N62|Hypertrophy of breast
N63|Unspecified lump in breast
N64|Other disorders of breast
N64.0|Fissure and fistula of nipple
N64.1|Fat necrosis of breast
N64.2|Atrophy of breast
N64.3|Galactorrhoea not associated with childbirth
N64.4|Mastodynia
N64.5|Other signs and symptoms in breast
N64.8|Other specified disorders of breast
N64.9|Disorder of breast, unspecified
N70|Salpingitis and oophoritis
N70.0|Acute salpingitis and oophoritis
N70.1|Chronic salpingitis and oophoritis
N70.9|Salpingitis and oophoritis, unspecified
N71|Inflammatory disease of uterus, except cervix
N71.0|Acute inflammatory disease of uterus
N71.1|Chronic inflammatory disease of uterus
N71.9|Inflammatory disease of uterus, unspecified
N72|Inflammatory disease of cervix uteri
N73|Other female pelvic inflammatory diseases
N73.0|Acute parametritis and pelvic cellulitis
N73.1|Chronic parametritis and pelvic cellulitis
N73.2|Unspecified parametritis and pelvic cellulitis
N73.3|Female acute pelvic peritonitis
N73.4|Female chronic pelvic peritonitis
N73.5|Female pelvic peritonitis, unspecified
N73.6|Female pelvic peritoneal adhesions
N73.8|Other specified female pelvic inflammatory diseases
N73.9|Female pelvic inflammatory disease, unspecified
N74|Female pelvic inflammatory disorders in diseases classified elsewhere
N74.0|Tuberculous infection of cervix uteri
N74.1|Female tuberculous pelvic inflammatory disease
N74.2|Female syphilitic pelvic inflammatory disease
N74.3|Female gonococcal pelvic inflammatory disease
N74.4|Female chlamydial pelvic inflammatory disease
N74.8|Female pelvic inflammatory disorders in other diseases classified elsewhere
N75|Diseases of Bartholin gland
N75.0|Cyst of Bartholin's gland
N75.1|Abscess of Bartholin's gland
N75.8|Other diseases of Bartholin's gland
N75.9|Disease of Bartholin's gland, unspecified
N76|Other inflammation of vagina and vulva
N76.0|Acute vaginitis
N76.1|Subacute and chronic vaginitis
N76.2|Acute vulvitis
N76.3|Subacute and chronic vulvitis
N76.4|Abscess of vulva
N76.5|Ulceration of vagina
N76.6|Ulceration of vulva
N76.8|Other specified inflammation of vagina and vulva
N77|Vulvovaginal ulceration and inflammation in diseases classified elsewhere
N77.0|Ulceration of vulva in infectious and parasitic diseases classified elsewhere
N77.1|Vaginitis vulvitis and vulvovaginitis in infectious and parasitic diseases classified elsewhere
N77.8|Vulvovaginal ulceration and inflammation in other diseases classified elsewhere
N80|Endometriosis
N80.0|Endometriosis of uterus
N80.1|Endometriosis of ovary
N80.2|Endometriosis of fallopian tube
N80.3|Endometriosis of pelvic peritoneum
N80.4|Endometriosis of rectovaginal septum and vagina
N80.5|Endometriosis of intestine
N80.6|Endometriosis in cutaneous scar
N80.8|Other endometriosis
N80.9|Endometriosis, unspecified
N81|Female genital prolapse
N81.0|Female urethrocele
N81.1|Cystocele
N81.2|Incomplete uterovaginal prolapse
N81.3|Complete uterovaginal prolapse
N81.4|Uterovaginal prolapse, unspecified
N81.5|Vaginal enterocele
N81.6|Rectocele
N81.8|Other female genital prolapse
N81.9|Female genital prolapse, unspecified
N82|Fistulae involving female genital tract
N82.0|Vesicovaginal fistula
N82.1|Other female urinary-genital tract fistulae
N82.2|Fistula of vagina to small intestine
N82.3|Fistula of vagina to large intestine
N82.4|Other female intestinal-genital tract fistulae
N82.5|Female genital tract-skin fistulae
N82.8|Other female genital tract fistulae
N82.9|Female genital tract fistula, unspecified
N83|Noninflammatory disorders of ovary, fallopian tube and broad ligament
N83.0|Follicular cyst of ovary
N83.1|Corpus luteum cyst
N83.2|Other and unspecified ovarian cysts
N83.3|Acquired atrophy of ovary and fallopian tube
N83.4|Prolapse and hernia of ovary and fallopian tube
N83.5|Torsion of ovary, ovarian pedicle and fallopian tube
N83.6|Haematosalpinx
N83.7|Haematoma of broad ligament
N83.8|Other noninflamatory disorders of ovary, fallopian tube and broad ligament
N83.9|Noninflammatory disorder of ovary, fallopian tube and broad ligament, unspecified
N84|Polyp of female genital tract
N84.0|Polyp of corpus uteri
N84.1|Polyp of cervix uteri
N84.2|Polyp of vagina
N84.3|Polyp of vulva
N84.8|Polyp of other parts of female genital tract
N84.9|Polyp of female genital tract, unspecified
N85|Other noninflammatory disorders of uterus, except cervix
N85.0|Endometrial glandular hyperplasia
N85.1|Endometrial adenomatous hyperplasia
N85.2|Hypertrophy of uterus
N85.3|Subinvolution of uterus
N85.4|Malposition of uterus
N85.5|Inversion of uterus
N85.6|Intrauterine synechiae
N85.7|Haematometra
N85.8|Other specified noninflammatory disorders of uterus
N85.9|Noninflammatory disorder of uterus, unspecified
N86|Erosion and ectropion of cervix uteri
N87|Dysplasia of cervix uteri
N87.0|Mild cervical dysplasia
N87.1|Moderate cervical dysplasia
N87.2|Severe cervical dysplasia, not elsewhere classified
N87.9|Dysplasia of cervix uteri, unspecified
N88|Other noninflammatory disorders of cervix uteri
N88.0|Leukoplakia of cervix uteri
N88.1|Old laceration of cervix uteri
N88.2|Stricture and stenosis of cervix uteri
N88.3|Incompetence of cervix uteri
N88.4|Hypertrophic elongation of cervix uteri
N88.8|Other specified noninflammatory disorders of cervix uteri
N88.9|Noninflammatory disorder of cervix uteri, unspecified
N89|Other noninflammatory disorders of vagina
N89.0|Mild vaginal dysplasia
N89.1|Moderate vaginal dysplasia
N89.2|Severe vaginal dysplasia, not elsewhere classified
N89.3|Dysplasia of vagina, unspecified
N89.4|Leukoplakia of vagina
N89.5|Stricture and atresia of vagina
N89.6|Tight hymenal ring
N89.7|Haematocolpos
N89.8|Other specified noninflammatory disorders of vagina
N89.9|Noninflammatory disorder of vagina, unspecified
N90|Other noninflammatory disorders of vulva and perineum
N90.0|Mild vulvar dysplasia
N90.1|Moderate vulvar dysplasia
N90.2|Severe vulvar dysplasia, not elsewhere classified
N90.3|Dysplasia of vulva, unspecified
N90.4|Leukoplakia of vulva
N90.5|Atrophy of vulva
N90.6|Hypertrophy of vulva
N90.7|Vulvar cyst
N90.8|Other specified noninflammatory disorders of vulva and perineum
N90.9|Noninflammatory disorder of vulva and perineum, unspecified
N91|Absent, scanty and rare menstruation
N91.0|Primary amenorrhoea
N91.1|Secondary amenorrhoea
N91.2|Amenorrhoea, unspecified
N91.3|Primary oligomenorrhoea
N91.4|Secondary oligomenorrhoea
N91.5|Oligomenorrhoea, unspecified
N92|Excessive, frequent and irregular menstruation
N92.0|Excessive and frequent menstruation with regular cycle
N92.1|Excessive and frequent menstruation with irregular cycle
N92.2|Excessive menstruation at puberty
N92.3|Ovulation bleeding
N92.4|Excessive bleeding in the premenopausal period
N92.5|Other specified irregular menstruation
N92.6|Irregular menstruation, unspecified
N93|Other abnormal uterine and vaginal bleeding
N93.0|Postcoital and contact bleeding
N93.8|Other specified abnormal uterine and vaginal bleeding
N93.9|Abnormal uterine and vaginal bleeding, unspecified
N94|Pain and other conditions associated with female genital organs and menstrual cycle
N94.0|Mittelschmerz
N94.1|Dyspareunia
N94.2|Vaginismus
N94.3|Premenstrual tension syndrome
N94.4|Primary dysmenorrhoea
N94.5|Secondary dysmenorrhoea
N94.6|Dysmenorrhoea, unspecified
N94.8|Other specified conditions associated with female genital organs and menstrual cycle
N94.9|Unspecified condition associated with female genital organs and menstrual cycle
N95|Menopausal and other perimenopausal disorders
N95.0|Postmenopausal bleeding
N95.1|Menopausal and female climacteric states
N95.2|Postmenopausal atrophic vaginitis
N95.3|States associated with artificial menopause
N95.8|Other specified menopausal and perimenopausal disorders
N95.9|Menopausal and perimenopausal disorder, unspecified
N96|Habitual aborter
N97|Female infertility
N97.0|Female infertility associated with anovulation
N97.1|Female infertility of tubal origin
N97.2|Female infertility of uterine origin
N97.3|Female infertility of cervical origin
N97.4|Female infertility associated with male factors
N97.8|Female infertility of other origin
N97.9|Female infertility, unspecified
N98|Complications associated with artificial fertilization
N98.0|Infection associated with artificial insemination
N98.1|Hyperstimulation of ovaries
N98.2|Complications attempted introduction fertilized ovum following in vitro fertilization
N98.3|Complications attempted introduction of embryo in embryo transfer
N98.8|Other complications associated with artificial fertilization
N98.9|Complication associated with artificial fertilization, unspecified
N99|Postprocedural disorders of genitourinary system, not elsewhere classified
N99.0|Postprocedural renal failure
N99.1|Postprocedural urethral stricture
N99.2|Postoperative adhesions of vagina
N99.3|Prolapse of vaginal vault after hysterectomy
N99.4|Postprocedural pelvic peritoneal adhesions
N99.5|Malfunction of external stoma of urinary tract
N99.8|Other postprocedural disorders of genitourinary system
N99.9|Postprocedural disorder of genitourinary system, unspecified
O00|Ectopic pregnancy
O00.0|Abdominal pregnancy
O00.1|Tubal pregnancy
O00.2|Ovarian pregnancy
O00.8|Other ectopic pregnancy
O00.9|Ectopic pregnancy, unspecified
O01|Hydatidiform mole
O01.0|Classical hydatidiform mole
O01.1|Incomplete and partial hydatidiform mole
O01.9|Hydatidiform mole, unspecified
O02|Other abnormal products of conception
O02.0|Blighted ovum and nonhydatidiform mole
O02.1|Missed abortion
O02.8|Other specified abnormal products of conception
O02.9|Abnormal product of conception, unspecified
O03|Spontaneous abortion
O03.0|Spontaneous abortion, incomplete abortion complicated by genital tract and pelvic infection
O03.1|Spontaneous abortion, incomplete abortion complicated by delayed or excessive haemorrhage
O03.2|Spontaneous abortion, incomplete, complicated by embolism
O03.3|Spontaneous abortion, incomplete, with other and unspecified complications
O03.4|Spontaneous abortion, incomplete, without complication
O03.5|Spontaneous abortion, complete or unspecified, complicated by genital tract and pelvic infection
O03.6|Spontaneous abortion, complete or unspecified, complicated by delayed or excessive haemorrhage
O03.7|Spontaneous abortion, complete or unspecified, complicated by embolism
O03.8|Spontaneous abortion, complete or unspecified, with other and unspecified complications
O03.9|Spontaneous abortion, complete or unspecified, without complication
O04|Medical abortion
O04.0|Medical abortion, incomplete, complicated by genital tract and pelvic infection
O04.1|Medical abortion, incomplete, complicated by delayed or excessive haemorrhage
O04.2|Medical abortion, incomplete, complicated by embolism
O04.3|Medical abortion, incomplete, with other and unspecified complications
O04.4|Medical abortion, incomplete, without complication
O04.5|Medical abortion, complete or unspecified, complicated by genital tract and pelvic infection
O04.6|Medical abortion, complete or unspecified, complicated by delayed or excessive haemorrhage
O04.7|Medical abortion, complete or unspecified, complicated by embolism
O04.8|Medical abortion, complete or unspecified, with other and unspecified complications
O04.9|Medical abortion, complete or unspecified, without complication
O05|Other abortion
O05.0|Other abortion, incomplete, complicated by genital tract and pelvic infection
O05.1|Other abortion, incomplete, complicated by delayed or excessive haemorrhage
O05.2|Other abortion, incomplete, complicated by embolism
O05.3|Other abortion, incomplete, with other and unspecified complications
O05.4|Other abortion, incomplete, without complication
O05.5|Other abortion, complete or unspecified, complicated by genital tract and pelvic infection
O05.6|Other abortion, complete or unspecified, complicated by delayed or excessive haemorrhage
O05.7|Other abortion, complete or unspecified, complicated by embolism
O05.8|Other abortion, complete or unspecified, with other and unspecified complications
O05.9|Other abortion, complete or unspecified, without complication
O06|Unspecified abortion
O06.0|Unspecified abortion, incomplete, complicated by genital tract and pelvic infection
O06.1|Unspecified abortion, incomplete, complicated by delayed or excessive haemorrhage
O06.2|Unspecified abortion, incomplete, complicated by embolism
O06.3|Unspecified abortion, incomplete, with other and unspecified complications
O06.4|Unspecified abortion, incomplete, without complication
O06.5|Unspecified abortion, complete or unspecified, complicated by genital tract and pelvic infection
O06.6|Unspecified abortion, complete or unspecified, complicated by delayed or excessive haemorrhage
O06.7|Unspecified abortion, complete or unspecified, complicated by embolism
O06.8|Unspecified abortion, complete or unspecified, with other and unspecified complications
O06.9|Unspecified abortion, complete or unspecified, without complication
O07|Failed attempted abortion
O07.0|Failed medical abortion, complicated by genital tract and pelvic infection
O07.1|Failed medical abortion complicated by delayed or excessive haemorrhage
O07.2|Failed medical abortion, complicated by embolism
O07.3|Failed medical abortion, with other and unspecified complications
O07.4|Failed medical abortion, without complication
O07.5|Other and unspecified failed attempted abortion, complicated by genital tract and pelvic infection
O07.6|Other and unspecified failed attempted abortion, complicated by delayed or excessive haemorrhage
O07.7|Other and unspecified failed attempted abortion, complicated by embolism
O07.8|Other and unspecified failed attempted abortion, with other and unspecified complications
O07.9|Other and unspecified failed attempted abortion, without complication
O08|Complications following abortion and ectopic and molar pregnancy
O08.0|Genital tract and pelvic infection following abortion and ectopic and molar pregnancy
O08.1|Delayed or excessive haemorrhage following abortion and ectopic and molar pregnancy
O08.2|Embolism following abortion and ectopic and molar pregnancy
O08.3|Shock following abortion and ectopic and molar pregnancy
O08.4|Renal failure following abortion and ectopic and molar pregnancy
O08.5|Metabolic disorders following abortion and ectopic and molar pregnancy
O08.6|Damage to pelvic organs and tissues following abortion and ectopic and molar pregnancy
O08.7|Other venous complications following abortion and ectopic and molar pregnancy
O08.8|Other complications following abortion and ectopic and molar pregnancy
O08.9|Complication following abortion and ectopic and molar pregnancy, unspecified
O10|Pre-existing hypertension complicating pregnancy, childbirth and the puerperium
O10.0|Pre-existing essential hypertension complicating pregnancy, childbirth and the puerperium
O10.1|Pre-existing hypertensive heart disease complicating pregnancy, childbirth and the puerperium
O10.2|Pre-existing hypertensive renal disease complicating pregnancy, childbirth and puerperium
O10.3|Pre-existing hypertensive heart and renal disease complicating pregnancy, childbirth and the puerperium
O10.4|Pre-existing secondary hypertension complicating pregnancy, childbirth and the puerperium
O10.9|Unspecified pre-existing hypertension complicating pregnancy, childbirth and the puerperium
O11|Pre-existing hypertensive disorder with superimposed proteinuria
O12|Gestational [pregnancy-induced] oedema and proteinuria without hypertension
O12.0|Gestational oedema
O12.1|Gestational proteinuria
O12.2|Gestational oedema with proteinuria
O13|Gestational [pregnancy-induced] hypertension without signification proteinuria
O14|Gestational [pregnancy-induced] hypertension with significant proteinuria
O14.0|Moderate pre-eclampsia
O14.1|Severe pre-eclampsia
O14.2|HELLP syndrome
O14.9|Pre-eclampsia, unspecified
O15|Eclampsia
O15.0|Eclampsia in pregnancy
O15.1|Eclampsia in labour
O15.2|Eclampsia in the puerperium
O15.9|Eclampsia, unspecified as to time period
O16|Unspecified maternal hypertension
O20|Haemorrhage in early pregnancy
O20.0|Threatened abortion
O20.8|Other haemorrhage in early pregnancy
O20.9|Haemorrhage in early pregnancy, unspecified
O21|Excessive vomiting in pregnancy
O21.0|Mild hyperemesis gravidarum
O21.1|Hyperemesis gravidarum with metabolic disturbance
O21.2|Late vomiting of pregnancy
O21.8|Other vomiting complicating pregnancy
O21.9|Vomiting of pregnancy, unspecified
O22|Venous complications in pregnancy
O22.0|Varicose veins of lower extremity in pregnancy
O22.1|Genital varices in pregnancy
O22.2|Superficial thrombophlebitis in pregnancy
O22.3|Deep phlebothrombosis in pregnancy
O22.4|Haemorrhoids in pregnancy
O22.5|Cerebral venous thrombosis in pregnancy
O22.8|Other venous complications in pregnancy
O22.9|Venous complication in pregnancy, unspecified
O23|Infections of genitourinary tract in pregnancy
O23.0|Infections of kidney in pregnancy
O23.1|Infections of bladder in pregnancy
O23.2|Infections of urethra in pregnancy
O23.3|Infections of other parts of urinary tract in pregnancy
O23.4|Unspecified infection of urinary tract in pregnancy
O23.5|Infections of the genital tract in pregnancy
O23.9|Other and unspecified genitourinary tract infection in pregnancy
O24|Diabetes mellitus in pregnancy
O24.0|Pre-existing diabetes mellitus, insulin-dependent
O24.1|Pre-existing diabetes mellitus, non-insulin-dependent
O24.2|Pre-existing malnutrition-related diabetes mellitus
O24.3|Pre-existing diabetes mellitus, unspecified
O24.4|Diabetes mellitus arising in pregnancy
O24.9|Diabetes mellitus in pregnancy, unspecified
O25|Malnutrition in pregnancy
O26|Maternal care for other conditions predominantly related to pregnancy
O26.0|Excessive weight gain in pregnancy
O26.1|Low weight gain in pregnancy
O26.2|Pregnancy care of habitual aborter
O26.3|Retained intrauterine contraceptive device in pregnancy
O26.4|Herpes gestationis
O26.5|Maternal hypotension syndrome
O26.6|Liver disorders in pregnancy, childbirth and the puerperium
O26.7|Subluxation of symphysis pubis in  pregnancy, childbirth and the puerperium
O26.8|Other specified pregnancy-related conditions
O26.9|Pregnancy-related condition, unspecified
O28|Abnormal findings on antenatal screening of mother
O28.0|Abnormal haematological  finding on antenatal screening of mother
O28.1|Abnormal biochemical finding on antenatal screening of mother
O28.2|Abnormal cytological finding on antenatal screening of mother
O28.3|Abnormal ultrasonic finding on antenatal screening of mother
O28.4|Abnormal radiological find on antenatal screening of mother
O28.5|Abnormal chromosomal and genetic finding antenatal screening of mother
O28.8|Other abnormal findings on antenatal screening of mother
O28.9|Abnormal finding on antenatal screening of mother, unspecified
O29|Complications of anaesthesia during pregnancy
O29.0|Pulmonary complications of anaesthesia during pregnancy
O29.1|Cardiac complications of anaesthesia during pregnancy
O29.2|Central nervous system complications of anaesthesia during pregnancy
O29.3|Toxic reaction to local anaesthesia during pregnancy
O29.4|Spinal and epidural anaesthesia-induced headache during pregnancy
O29.5|Other complications of spinal and epidural anaesthesia during pregnancy
O29.6|Failed or difficult intubation during pregnancy
O29.8|Other complications of anaesthesia during pregnancy
O29.9|Complication of anaesthesia during pregnancy, unspecified
O30|Multiple gestation
O30.0|Twin pregnancy
O30.1|Triplet pregnancy
O30.2|Quadruplet pregnancy
O30.8|Other multiple gestation
O30.9|Multiple gestation, unspecified
O31|Complications specific to multiple gestation
O31.0|Papyraceous fetus
O31.1|Continuing pregnancy after abortion of one fetus or more
O31.2|Continuing pregnancy after intrauterine death of one fetus or more
O31.8|Other complications specific to multiple gestation
O32|Maternal care for known or suspected malpresentation of fetus
O32.0|Maternal care for unstable lie
O32.1|Maternal care for breech presentation
O32.2|Maternal care for transverse and oblique lie
O32.3|Maternal care for face, brow and chin presentation
O32.4|Maternal care for high head at term
O32.5|Maternal care for multiple gestation with malpresentation of one fetus or more
O32.6|Maternal care for compound presentation
O32.8|Maternal care for other malpresentation of fetus
O32.9|Maternal care for malpresentation of fetus, unspecified
O33|Maternal care for known or suspected disproportion
O33.0|Maternal care for disproportion due to deformity of maternal pelvic bones
O33.1|Maternal care for disproportion due to generally contracted pelvis
O33.2|Maternal care for disproportion due to inlet contraction of pelvis
O33.3|Maternalcare for disproportion due to outlet contract of pelvis
O33.4|Maternal care for disproportion of mixed maternal and fetal origin
O33.5|Maternal care for disproportion due to unusually large fetus
O33.6|Maternal care for disproportion due to hydrocephalic fetus
O33.7|Maternal care for disproportion due to other fetal deformities
O33.8|Maternal care for disproportion of other origin
O33.9|Maternal care for disproportion, unspecified
O34|Maternal care for known or suspected abnormality of pelvic organs
O34.0|Maternal care for congenital malformation of uterus
O34.1|Maternal care for tumour of corpus uteri
O34.2|Maternal care due to uterine scar from previous surgery
O34.3|Maternal care for cervical incompetence
O34.4|Maternal care for other abnormalities of cervix
O34.5|Maternal care for other abnormalities of gravid uterus
O34.6|Maternal care for abnormality of vagina
O34.7|Maternal care for abnormality of vulva and perineum
O34.8|Maternal care for other abnormalities of pelvic organs
O34.9|Maternal care for abnormality of pelvic organ, unspecified
O35|Maternal care for known or suspected fetal abnormality and damage
O35.0|Maternal care for suspected central nervous system malformation in fetus
O35.1|Maternal care for suspected chromosomal abnormality in fetus
O35.2|Maternal care for suspected hereditary disease in fetus
O35.3|Maternal care for suspected damage to fetus from viral disease in mother
O35.4|Maternal care for suspected damage to fetus from alcohol
O35.5|Maternal care for suspected damage to fetus by drugs
O35.6|Maternal care for suspected damage to fetus by radiation
O35.7|Maternal care for suspected damage to fetus by other medical procedures
O35.8|Maternal care for other suspected fetal abnormality and damage
O35.9|Maternal care for suspected fetal abnormality and damage, unspecified
O36|Maternal care for other known or suspected fetal problems
O36.0|Maternal care for rhesus isoimmunization
O36.1|Maternal care for other isoimmunization
O36.2|Maternal care for hydrops fetalis
O36.3|Maternal care for signs of fetal hypoxia
O36.4|Maternal care for intrauterine death
O36.5|Maternal care for poor fetal growth
O36.6|Maternal care for excessive fetal growth
O36.7|Maternal care for viable fetus in abdominal pregnancy
O36.8|Maternal care for other specified fetal problems
O36.9|Maternal care for fetal problem, unspecified
O40|Polyhydramnios
O41|Other disorders of amniotic fluid and membranes
O41.0|Oligohydramnios
O41.1|Infection of amniotic sac and membranes
O41.8|Other specified disorders of amniotic fluid and membranes
O41.9|Disorder of amniotic fluid and membranes, unspecified
O42|Premature rupture of membranes
O42.0|Premature rupture of membranes, onset of labour within 24 hours
O42.1|Premature rupture of membranes, onset of labour after 24 hours
O42.2|Premature rupture of membranes, labour delayed by therapy
O42.9|Premature rupture of membranes, unspecified
O43|Placental disorders
O43.0|Placental transfusion syndromes
O43.1|Malformation of placenta
O43.2|Morbidly adherent placenta
O43.8|Other placental disorders
O43.9|Placental disorder, unspecified
O44|Placenta praevia
O44.0|Placenta praevia specified as without haemorrhage
O44.1|Placenta praevia with haemorrhage
O45|Premature separation of placenta [abruptio placentae]
O45.0|Premature separation of placenta with coagulation defect
O45.8|Other premature separation of placenta
O45.9|Premature separation of placenta, unspecified
O46|Antepartum haemorrhage, not elsewhere classified
O46.0|Antepartum haemorrhage with coagulation defect
O46.8|Other antepartum haemorrhage
O46.9|Antepartum haemorrhage, unspecified
O47|False labour
O47.0|False labour before 37 completed weeks of gestation
O47.1|False labour at or after 37 completed weeks of gestation
O47.9|False labour, unspecified
O48|Prolonged pregnancy
O60|Preterm labour and delivery
O60.0|Preterm labour without delivery
O60.1|Preterm labour with preterm delivery
O60.2|Preterm labour with term delivery
O60.3|Preterm delivery without spontaneous labour
O61|Failed induction of labour
O61.0|Failed medical induction of labour
O61.1|Failed instrumental induction of labour
O61.8|Other failed induction of labour
O61.9|Failed induction of labour, unspecified
O62|Abnormalities of forces of labour
O62.0|Primary inadequate contractions
O62.1|Secondary uterine inertia
O62.2|Other uterine inertia
O62.3|Precipitate labour
O62.4|Hypertonic, incoordinate, and prolonged uterine contractions
O62.8|Other abnormalities of forces of labour
O62.9|Abnormality of forces of labour, unspecified
O63|Long labour
O63.0|Prolonged first stage of labour
O63.1|Prolonged second stage of labour
O63.2|Delayed delivery of second twin, triplet, etc
O63.9|Long labour, unspecified
O64|Obstructed labour due to malposition and malpresentation of fetus
O64.0|Obstructed labour due to incomplete rotation of fetal head
O64.1|Obstructed labour due to breech presentation
O64.2|Obstructed labour due to face presentation
O64.3|Obstructed labour due to brow presentation
O64.4|Obstructed labour due to shoulder presentation
O64.5|Obstructed labour due to compound presentation
O64.8|Obstructed labour due other malposition and malpresentation
O64.9|Obstructed labour due malposition and malpresentation, unspecified
O65|Obstructed labour due to maternal pelvic abnormality
O65.0|Obstructed labour due to deformed pelvis
O65.1|Obstructed labour due to generally contracted pelvis
O65.2|Obstructed labour due to pelvic inlet contraction
O65.3|Obstructed labour due pelvic outlet and mid-cavity contraction
O65.4|Obstructed labour due to fetopelvic disproportion, unspecified
O65.5|Obstructed labour due abnormality of maternal pelvic organs
O65.8|Obstructed labour due to other maternal pelvic abnormalities
O65.9|Obstructed labour due to maternal pelvic abnormality, unspecified
O66|Other obstructed labour
O66.0|Obstructed labour due to shoulder dystocia
O66.1|Obstructed labour due to locked twins
O66.2|Obstructed labour due to unusually large fetus
O66.3|Obstructed labour due to other abnormalities of fetus
O66.4|Failed trial of labour, unspecified
O66.5|Failed application of vacuum extractor and forceps, unspecified
O66.8|Other specified obstructed labour
O66.9|Obstructed labour, unspecified
O67|Labour and delivery complicated by intrapartum haemorrhage, not elsewhere classified
O67.0|Intrapartum haemorrhage with coagulation defect
O67.8|Other intrapartum haemorrhage
O67.9|Intrapartum haemorrhage, unspecified
O68|Labour and delivery complicated by fetal stress [distress]
O68.0|Labour and delivery complicated by fetal heart rate anomaly
O68.1|Labour and delivery complicated by meconium in amniotic fluid
O68.2|Labour and delivery complicated fetal heart rate anomaly with meconium in amniot fluid
O68.3|Labour and delivery complicated by biochemical evidence of fetal stress
O68.8|Labour and delivery complicated by other evidence of fetal stress
O68.9|Labour and delivery complicated by fetal stress, unspecified
O69|Labour and delivery complicated by umbilical cord complications
O69.0|Labour and delivery complicated by prolapse of cord
O69.1|Labour and delivery complicated cord around neck, with compression
O69.2|Labour and delivery complicated by other cord entanglement
O69.3|Labour and delivery complicated by short cord
O69.4|Labour and delivery complicated by vasa praevia
O69.5|Labour and delivery complicated by vascular lesion of cord
O69.8|Labour and delivery complicated by other cord complications
O69.9|Labour and delivery complicated by cord complication, unspecified
O70|Perineal laceration during delivery
O70.0|First degree perineal laceration during delivery
O70.1|Second degree perineal laceration during delivery
O70.2|Third degree perineal laceration during delivery
O70.3|Fourth degree perineal laceration during delivery
O70.9|Perineal laceration during delivery, unspecified
O71|Other obstetric trauma
O71.0|Rupture of uterus before onset of labour
O71.1|Rupture of uterus during labour
O71.2|Postpartum inversion of uterus
O71.3|Obstetric laceration of cervix
O71.4|Obstetric high vaginal laceration alone
O71.5|Other obstetric injury to pelvic organs
O71.6|Obstetric damage to pelvic joints and ligaments
O71.7|Obstetric haematoma of pelvis
O71.8|Other specified obstetric trauma
O71.9|Obstetric trauma, unspecified
O72|Postpartum haemorrhage
O72.0|Third-stage haemorrhage
O72.1|Other immediate postpartum haemorrhage
O72.2|Delayed and secondary postpartum haemorrhage
O72.3|Postpartum coagulation defects
O73|Retained placenta and membranes, without haemorrhage
O73.0|Retained placenta without haemorrhage
O73.1|Retained portions of placenta and membranes, without haemorrhage
O74|Complications of anaesthesia during labour and delivery
O74.0|Aspiration pneumonitis due to anaesthesia during labour and delivery
O74.1|Other pulmonary complications anaesthesia during labour and delivery
O74.2|Cardiac complications of anaesthesia during labour and delivery
O74.3|Central nervous system complications of anaesthesia during labour and delivery
O74.4|Toxic reaction to local anaesthesia during labour and delivery
O74.5|Spinal and epidural anaesthesia-induced headache during labour and delivery
O74.6|Other complications of spinal and epidural anaesthesia during labour and delivery
O74.7|Failed or difficult intubation during labour and delivery
O74.8|Other complications of anaesthesia during labour and delivery
O74.9|Complication of anaesthesia during labour and delivery, unspecified
O75|Other complications of labour and delivery, not elsewhere classified
O75.0|Maternal distress during labour and delivery
O75.1|Shock during or following labour and delivery
O75.2|Pyrexia during labour, not elsewhere classified
O75.3|Other infection during labour
O75.4|Other complications of obstetric surgery and procedures
O75.5|Delayed delivery after artificial rupture of membranes
O75.6|Delayed delivery after spontaneous or unspecified rupture of membranes
O75.7|Vaginal delivery following previous caesarean section
O75.8|Other specified complications of labour and delivery
O75.9|Complication of labour and delivery, unspecified
O80|Single spontaneous delivery
O80.0|Spontaneous vertex delivery
O80.1|Spontaneous breech delivery
O80.8|Other single spontaneous delivery
O80.9|Single spontaneous delivery, unspecified
O81|Single delivery by forceps and vacuum extractor
O81.0|Low forceps delivery
O81.1|Mid-cavity forceps delivery
O81.2|Mid-cavity forceps with rotation
O81.3|Other and unspecified forceps delivery
O81.4|Vacuum extractor delivery
O81.5|Delivery by combination of forceps and vacuum extractor
O82|Single delivery by caesarean section
O82.0|Delivery by elective caesarean section
O82.1|Delivery by emergency caesarean section
O82.2|Delivery by caesarean hysterectomy
O82.8|Other single delivery by caesarean section
O82.9|Delivery by caesarean section, unspecified
O83|Other assisted single delivery
O83.0|Breech extraction
O83.1|Other assisted breech delivery
O83.2|Other manipulation-assisted delivery
O83.3|Delivery of viable fetus in abdominal pregnancy
O83.4|Destructive operation for delivery
O83.8|Other specified assisted single delivery
O83.9|Assisted single delivery, unspecified
O84|Multiple delivery
O84.0|Multiple delivery, all spontaneous
O84.1|Multiple delivery, all by forceps and vacuum extractor
O84.2|Multiple delivery, all by caesarean section
O84.8|Other multiple delivery
O84.9|Multiple delivery, unspecified
O85|Puerperal sepsis
O86|Other puerperal infections
O86.0|Infection of obstetric surgical wound
O86.1|Other infection of genital tract following delivery
O86.2|Urinary tract infection following delivery
O86.3|Other genitourinary tract infections following delivery
O86.4|Pyrexia of unknown origin following delivery
O86.8|Other specified puerperal infections
O87|Venous complications in the puerperium
O87.0|Superficial thrombophlebitis in the puerperium
O87.1|Deep phlebothrombosis in the puerperium
O87.2|Haemorrhoids in the puerperium
O87.3|Cerebral venous thrombosis in the puerperium
O87.8|Other venous complications in the puerperium
O87.9|Venous complication in the puerperium, unspecified
O88|Obstetric embolism
O88.0|Obstetric air embolism
O88.1|Amniotic fluid embolism
O88.2|Obstetric blood-clot embolism
O88.3|Obstetric pyaemic and septic embolism
O88.8|Other obstetric embolism
O89|Complications of anaesthesia during the puerperium
O89.0|Pulmonary complications of anaesthesia during the puerperium
O89.1|Cardiac complications of anaesthesia during the puerperium
O89.2|Central nervous system complications of anaesthesia during the puerperium
O89.3|Toxic reaction to local anaesthesia during the puerperium
O89.4|Spinal and epidural anaesthesia-induced headache during the puerperium
O89.5|Other complications of spinal and epidural anaesthesia during puerperium
O89.6|Failed or difficult intubation during the puerperium
O89.8|Other complications of anaesthesia during the puerperium
O89.9|Complication of anaesthesia during the puerperium, unspecified
O90|Complications of the puerperium, not elsewhere classified
O90.0|Disruption of caesarean section wound
O90.1|Disruption of perineal obstetric wound
O90.2|Haematoma of obstetric wound
O90.3|Cardiomyopathy in the puerperium
O90.4|Postpartum acute renal failure
O90.5|Postpartum thyroiditis
O90.8|Other complications of the puerperium, not elsewhere classified
O90.9|Complication of the puerperium, unspecified
O91|Infections of breast associated with childbirth
O91.0|Infection of nipple associated with childbirth
O91.1|Abscess of breast associated with childbirth
O91.2|Nonpurulent mastitis associated with childbirth
O92|Other disorders of breast and lactation associated with childbirth
O92.0|Retracted nipple associated with childbirth
O92.1|Cracked nipple associated with childbirth
O92.2|Other and unspecified disorders of breast associated with childbirth
O92.3|Agalactia
O92.4|Hypogalactia
O92.5|Suppressed lactation
O92.6|Galactorrhoea
O92.7|Other and unspecified disorders of lactation
O94|Sequelae of complication of pregnancy, childbirth and the puerperium
O95|Obstetric death of unspecified cause
O96|Death from any obstetric cause occuring more than 42 days but less than one year after delivery
O96.0|Death from direct obstetric cause
O96.1|Death from indirect obstetric cause
O96.9|Death from unspecified obstetric cause
O97|Death from sequelae of direct obstetric causes
O97.0|Death from sequelae of direct obstetric cause
O97.1|Death from sequelae of indirect obstetric cause
O97.9|Death from sequelae of obstetric cause, unspecified
O98|Maternal infectious and parasitic diseases classifiable elsewhere but complicating pregnancy, childbirth and the puerperium
O98.0|Tuberculosis complicating pregnancy, childbirth and the puerperium
O98.1|Syphilis complicating pregnancy, childbirth and the puerperium
O98.2|Gonorrhoea complicating pregnancy, childbirth and the puerperium
O98.3|Other infections predominantly sexual mode of transmission complicating pregnancy, childbirth and the puerperium
O98.4|Viral hepatitis complicating pregnancy, childbirth and the puerperium
O98.5|Other viral diseases complicating pregnancy, childbirth and the puerperium
O98.6|Protozoal diseases complicating pregnancy, childbirth and the puerperium
O98.7|Human immunodeficiency [HIV] disease complicating pregnancy, childbirth and the puerperium
O98.8|Other maternal infectious parasitic diseases complicating pregnancy, childbirth and the puerperium
O98.9|Unspecified maternal infectious parasitic disease complicating pregnancy, childbirth and the puerperium
O99|Other maternal diseases classifiable elsewhere but complicating pregnancy, childbirth and the puerperium
O99.0|Anaemia complicating pregnancy, childbirth and the puerperium
O99.1|Other diseases of the blood and blood-forming organs and certain disorders involving the immune mechanism complicating pregnancy, childbirth and the puerperium
O99.2|Endocrine, nutritional metabolic diseases complicating pregnancy, childbirth and the puerperium
O99.3|Mental disorders and diseases of the nervous system complicating pregnancy, childbirth and the puerperium
O99.4|Diseases of the circulatory system complicating pregnancy, childbirth and the puerperium
O99.5|Diseases of the respiratory system complicating pregnancy, childbirth and the puerperium
O99.6|Diseases of the digestive system complicating pregnancy, childbirth and the puerperium
O99.7|Diseases of the skin and subcutaneous tissue complicating pregnancy, childbirth and the puerperium
O99.8|Other specified diseases and conditions complicating pregnancy, childbirth and the puerperium
P00|Fetus and newborn affected by maternal conditions that may be unrelated to present pregnancy
P00.0|Fetus and newborn afected by maternal hypertensive disord
P00.1|Fet and newborn afected by mat renal and urinary tract dis
P00.2|Fetus and newborn affected by mat infect and parasitic dis
P00.3|Fetus and newborn affected oth mat circulatory and resp dis
P00.4|Fetus and newborn affected by maternal nutritional disorders
P00.5|Fetus and newborn affected by maternal injury
P00.6|Fetus and newborn affected by surgical procedure on mother
P00.7|Fetus and newborn affected other medic procs on mother nec
P00.8|Fetus and newborn affected by other maternal conditions
P00.9|Fetus and newborn affected by unspecified maternal condition
P01|Fetus and newborn affected by maternal complications of pregnancy
P01.0|Fetus and newborn affected by incompetent cervix
P01.1|Fetus and newborn affected by premature rupture of membranes
P01.2|Fetus and newborn affected by oligohydramnios
P01.3|Fetus and newborn affected by polyhydramnios
P01.4|Fetus and newborn affected by ectopic pregnancy
P01.5|Fetus and newborn affected by multiple pregnancy
P01.6|Fetus and newborn affected by maternal death
P01.7|Fetus and newborn affected by malpresentation before labour
P01.8|Fetus and newborn affected other maternal comps of preg
P01.9|Fetus and newborn affect by maternal comp of preg unspec act
P02|Fetus and newborn affected by complications of placenta, cord and membranes
P02.0|Fetus and newborn affected by placenta praevia
P02.1|Fetus and newborn affect oth forms placent sepn haemorrh
P02.2|Fetus newborn affect other unsp morph funct abnorm placent
P02.3|Fet and newborn affected by placental transfusion syndr
P02.4|Fetus and newborn affected by prolapsed cord
P02.5|Fetus and newborn affected other compression umb cord
P02.6|Fetus and newborn affect oth unspec conds of umbilical cord
P02.7|Fetus and newborn affected by chorioamnionitis
P02.8|Fetus and newborn affect by oth abnormalities of membr
P02.9|Fetus and newborn affected by abnorm of membranes unsp
P03|Fetus and newborn affected by other complications of labour and delivery
P03.0|Fetus and newborn affected by breech delivery and extraction
P03.1|Fet newborn affect oth malpresent malpos disprop lab deliv
P03.2|Fetus and newborn affected by forceps delivery
P03.3|Fet and newborn affected deliv vacuum extractor ventouse
P03.4|Fetus and newborn affected by caesarean delivery
P03.5|Fetus and newborn affected by precipitate delivery
P03.6|Fetus and newborn affected by abnormal uterine contractions
P03.8|Fetus and newborn affected other spec comps of labour deliv
P03.9|Fetus and newborn affected by comp of lab and deliv unsp
P04|Fetus and newborn affected by noxious influences transmitted via placenta or breast milk
P04.0|Fet newborn affect mat anaesth and analges preg lab del
P04.1|Fetus and newborn affected by other maternal medication
P04.2|Fetus and newborn affected by maternal use of tobacco
P04.3|Fetus and newborn affected by maternal use of alcohol
P04.4|Fetus and newborn affected by mat use of drugs of addiction
P04.5|Fetus and newborn afect by mat use of nutritional chem subs
P04.6|Fet  newborn affect mat exposure to environml chem subs
P04.8|Fetus and newborn affected by other mat noxious influences
P04.9|Fetus and newborn affected by mat noxious influence unspec act
P05|Slow fetal growth and fetal malnutrition
P05.0|Light for gestational age
P05.1|Small for gestational age
P05.2|Fet malnutrit without mention light or small for gestat age
P05.9|Slow fetal growth, unspecified
P07|Disorders related to short gestation and low birth weight, not elsewhere classified
P07.0|Extremely low birth weight
P07.1|Other low birth weight
P07.2|Extreme immaturity
P07.3|Other preterm infants
P08|Disorders related to long gestation and high birth weight
P08.0|Exceptionally large baby
P08.1|Other heavy for gestational age infants
P08.2|Post-term infant, not heavy for gestational age
P10|Intracranial laceration and haemorrhage due to birth injury
P10.0|Subdural haemorrhage due to birth injury
P10.1|Cerebral haemorrhage due to birth injury
P10.2|Intraventricular haemorrhage due to birth injury
P10.3|Subarachnoid haemorrhage due to birth injury
P10.4|Tentorial tear due to birth injury
P10.8|Oth intracranial lacerations and haemorrhages due birth inj
P10.9|Unsp intracranial laceration and haemorrhage due  birth inj
P11|Other birth injuries to central nervous system
P11.0|Cerebral oedema due to birth injury
P11.1|Other specified brain damage due to birth injury
P11.2|Unspecified brain damage due to birth injury
P11.3|Birth injury to facial nerve
P11.4|Birth injury to other cranial nerves
P11.5|Birth injury to spine and spinal cord
P11.9|Birth injury to central nervous system, unspecified
P12|Birth injury to scalp
P12.0|Cephalhaematoma due to birth injury
P12.1|Chignon due to birth injury
P12.2|Epicranial subaponeurotic haemorrhage due to birth injury
P12.3|Bruising of scalp due to birth injury
P12.4|Monitoring injury of scalp of newborn
P12.8|Other birth injuries to scalp
P12.9|Birth injury to scalp, unspecified
P13|Birth injury to skeleton
P13.0|Fracture of skull due to birth injury
P13.1|Other birth injuries to skull
P13.2|Birth injury to femur
P13.3|Birth injury to other long bones
P13.4|Fracture of clavicle due to birth injury
P13.8|Birth injuries to other parts of skeleton
P13.9|Birth injury to skeleton, unspecified
P14|Birth injury to peripheral nervous system
P14.0|Erb's paralysis due to birth injury
P14.1|Klumpke's paralysis due to birth injury
P14.2|Phrenic nerve paralysis due to birth injury
P14.3|Other brachial plexus birth injuries
P14.8|Birth injuries to other parts of peripheral nervous system
P14.9|Birth injury to peripheral nervous system, unspecified
P15|Other birth injuries
P15.0|Birth injury to liver
P15.1|Birth injury to spleen
P15.2|Sternomastoid injury due to birth injury
P15.3|Birth injury to eye
P15.4|Birth injury to face
P15.5|Birth injury to external genitalia
P15.6|Subcutaneous fat necrosis due to birth injury
P15.8|Other specified birth injuries
P15.9|Birth injury, unspecified
P20|Intrauterine hypoxia
P20.0|Intrauterine hypoxia first noted before onset of labour
P20.1|Intrauterine hypoxia first noted during labour and delivery
P20.9|Intrauterine hypoxia, unspecified
P21|Birth asphyxia
P21.0|Severe birth asphyxia
P21.1|Mild and moderate birth asphyxia
P21.9|Birth asphyxia, unspecified
P22|Respiratory distress of newborn
P22.0|Respiratory distress syndrome of newborn
P22.1|Transient tachypnoea of newborn
P22.8|Other respiratory distress of newborn
P22.9|Respiratory distress of newborn, unspecified
P23|Congenital pneumonia
P23.0|Congenital pneumonia due to viral agent
P23.1|Congenital pneumonia due to chlamydia
P23.2|Congenital pneumonia due to staphylococcus
P23.3|Congenital pneumonia due to streptococcus, group b
P23.4|Congenital pneumonia due to escherichia coli
P23.5|Congenital pneumonia due to pseudomonas
P23.6|Congenital pneumonia due to other bacterial agents
P23.8|Congenital pneumonia due to other organisms
P23.9|Congenital pneumonia, unspecified
P24|Neonatal aspiration syndromes
P24.0|Neonatal aspiration of meconium
P24.1|Neonatal aspiration of amniotic fluid and mucus
P24.2|Neonatal aspiration of blood
P24.3|Neonatal aspiration of milk and regurgitated food
P24.8|Other neonatal aspiration syndromes
P24.9|Neonatal aspiration syndrome, unspecified
P25|Interstitial emphysema and related conditions originating in the perinatal period
P25.0|Interstitial emphysema originating in the perinatal period
P25.1|Pneumothorax originating in the perinatal period
P25.2|Pneumomediastinum originating in the perinatal period
P25.3|Pneumopericardium originating in the perinatal period
P25.8|Oth conds rel interstit emphysema orig in perinatal period
P26|Pulmonary haemorrhage originating in the perinatal period
P26.0|Tracheobronchial haemorrhage origin in the perinatal period
P26.1|Massive pulmonary haemorrhage orig in the perinatal period
P26.8|Oth pulmonary haemorrhages originating in perinatal period
P26.9|Unspec pulmonary haemorrhage origin in the perinatal period
P27|Chronic respiratory disease originating in the perinatal period
P27.0|Wilson-mikity syndrome
P27.1|Bronchopulmonary dysplasia origin in the perinatal period
P27.8|Other chronic resp diseases origin in the perinatal period
P27.9|Unspec chronic resp disease origin in the perinatal period
P28|Other respiratory conditions originating in the perinatal period
P28.0|Primary atelectasis of newborn
P28.1|Other and unspecified atelectasis of newborn
P28.2|Cyanotic attacks of newborn
P28.3|Primary sleep apnoea of newborn
P28.4|Other apnoea of newborn
P28.5|Respiratory failure of newborn
P28.8|Other specified respiratory conditions of newborn
P28.9|Respiratory condition of newborn, unspecified
P29|Cardiovascular disorders originating in the perinatal period
P29.0|Neonatal cardiac failure
P29.1|Neonatal cardiac dysrhythmia
P29.2|Neonatal hypertension
P29.3|Persistent fetal circulation
P29.4|Transient myocardial ischaemia of newborn
P29.8|Oth cardiovascular disorders origin in the perinatal period
P29.9|Cardiovascular disorder origin in the perinatal period unsp
P35|Congenital viral diseases
P35.0|Congenital rubella syndrome
P35.1|Congenital cytomegalovirus infection
P35.2|Congenital herpesviral [herpes simplex] infection
P35.3|Congenital viral hepatitis
P35.8|Other congenital viral diseases
P35.9|Congenital viral disease, unspecified
P36|Bacterial sepsis of newborn
P36.0|Sepsis of newborn due to streptococcus, group b
P36.1|Sepsis of newborn due to other and unspecified streptococci
P36.2|Sepsis of newborn due to staphylococcus aureus
P36.3|Sepsis of newborn due to other and unspecified staphylococci
P36.4|Sepsis of newborn due to escherichia coli
P36.5|Sepsis of newborn due to anaerobes
P36.8|Other bacterial sepsis of newborn
P36.9|Bacterial sepsis of newborn, unspecified
P37|Other congenital infectious and parasitic diseases
P37.0|Congenital tuberculosis
P37.1|Congenital toxoplasmosis
P37.2|Neonatal (disseminated) listeriosis
P37.3|Congenital falciparum malaria
P37.4|Other congenital malaria
P37.5|Neonatal candidiasis
P37.8|Other specified congenital infectious and parasitic diseases
P37.9|Congenital infectious and parasitic disease, unspecified
P38|Omphalitis of newborn with or without mild haemorrhage
P39|Other infections specific to the perinatal period
P39.0|Neonatal infective mastitis
P39.1|Neonatal conjunctivitis and dacryocystitis
P39.2|Intra-amniotic infection of fetus, not elsewhere classified
P39.3|Neonatal urinary tract infection
P39.4|Neonatal skin infection
P39.8|Other specified infections specific to the perinatal period
P39.9|Infection specific to the perinatal period, unspecified
P50|Fetal blood loss
P50.0|Fetal blood loss from vasa praevia
P50.1|Fetal blood loss from ruptured cord
P50.2|Fetal blood loss from placenta
P50.3|Haemorrhage into co-twin
P50.4|Haemorrhage into maternal circulation
P50.5|Fetal blood loss from cut end of co-twin's cord
P50.8|Other fetal blood loss
P50.9|Fetal blood loss, unspecified
P51|Umbilical haemorrhage of newborn
P51.0|Massive umbilical haemorrhage of newborn
P51.8|Other umbilical haemorrhages of newborn
P51.9|Umbilical haemorrhage of newborn, unspecified
P52|Intracranial nontraumatic haemorrhage of fetus and newborn
P52.0|Intraventric (nontraumatic) haemorhage grade 1 fet newborn
P52.1|Intraventric (nontraumatic) haemorhage grade 2 fet newborn
P52.2|Intraventric (nontraumatic) haemorhage grade 3 fet newborn
P52.3|Unspec intraventric (nontraumatic) haemorh fetus newborn
P52.4|Intracerebral (nontraumatic) haemorrhage of fet and newborn
P52.5|Subarachnoid (nontraumatic) haemorrhage of fetus and newborn
P52.6|Cerebelar (nontraum) an post fossa haemorhage fet newborn
P52.8|Oth intracranial (nontraumatic) haemorrhages fetus newborn
P52.9|Intracranial (nontraumatic) haemorrhage fetus  newborn unsp
P53|Haemorrhagic disease of fetus and newborn
P54|Other neonatal haemorrhages
P54.0|Neonatal haematemesis
P54.1|Neonatal melaena
P54.2|Neonatal rectal haemorrhage
P54.3|Other neonatal gastrointestinal haemorrhage
P54.4|Neonatal adrenal haemorrhage
P54.5|Neonatal cutaneous haemorrhage
P54.6|Neonatal vaginal haemorrhage
P54.8|Other specified neonatal haemorrhages
P54.9|Neonatal haemorrhage, unspecified
P55|Haemolytic disease of fetus and newborn
P55.0|Rh isoimmunization of fetus and newborn
P55.1|Abo isoimmunization of fetus and newborn
P55.8|Other haemolytic diseases of fetus and newborn
P55.9|Haemolytic disease of fetus and newborn, unspecified
P56|Hydrops fetalis due to haemolytic disease
P56.0|Hydrops fetalis due to isoimmunization
P56.9|Hydrops fetalis due to other and unspec haemolytic disease
P57|Kernicterus
P57.0|Kernicterus due to isoimmunization
P57.8|Other specified kernicterus
P57.9|Kernicterus, unspecified
P58|Neonatal jaundice due to other excessive haemolysis
P58.0|Neonatal jaundice due to bruising
P58.1|Neonatal jaundice due to bleeding
P58.2|Neonatal jaundice due to infection
P58.3|Neonatal jaundice due to polycythaemia
P58.4|Neon jaund due drug tox transmit from mother or given nwbrn
P58.5|Neonatal jaundice due to swallowed maternal blood
P58.8|Neonatal jaundice due to oth specif excessive haemolysis
P58.9|Neonatal jaundice due to excessive haemolysis, unspecified
P59|Neonatal jaundice from other and unspecified causes
P59.0|Neonatal jaundice associated with preterm delivery
P59.1|Inspissated bile syndrome
P59.2|Neonat jaundice from oth and unspec hepatocellul damage
P59.3|Neonatal jaundice from breast milk inhibitor
P59.8|Neonatal jaundice from other specified causes
P59.9|Neonatal jaundice, unspecified
P60|Disseminated intravascular coagulation of fetus and newborn
P61|Other perinatal haematological disorders
P61.0|Transient neonatal thrombocytopenia
P61.1|Polycythaemia neonatorum
P61.2|Anaemia of prematurity
P61.3|Congenital anaemia from fetal blood loss
P61.4|Other congenital anaemias, not elsewhere classified
P61.5|Transient neonatal neutropenia
P61.6|Other transient neonatal disorders of coagulation
P61.8|Other specified perinatal haematological disorders
P61.9|Perinatal haematological disorder, unspecified
P70|Transitory disorders of carbohydrate metabolism specific to fetus and newborn
P70.0|Syndrome of infant of mother with gestational diabetes
P70.1|Syndrome of infant of a diabetic mother
P70.2|Neonatal diabetes mellitus
P70.3|Iatrogenic neonatal hypoglycaemia
P70.4|Other neonatal hypoglycaemia
P70.8|Oth transitory disorder carbohydrate metab fet and newborn
P70.9|Trans disorder carbohydrate metab of fet and newborn unspec act
P71|Transitory neonatal disorders of calcium and magnesium metabolism
P71.0|Cow's milk hypocalcaemia in newborn
P71.1|Other neonatal hypocalcaemia
P71.2|Neonatal hypomagnesaemia
P71.3|Neonatal tetany without calcium or magnesium deficiency
P71.4|Transitory neonatal hypoparathyroidism
P71.8|Oth transitory neonatl disord calcium and magnesium metab
P71.9|Transitory neonatl disord calcium and magnes metab uns
P72|Other transitory neonatal endocrine disorders
P72.0|Neonatal goitre, not elsewhere classified
P72.1|Transitory neonatal hyperthyroidism
P72.2|Other transitory neonatal disorders of thyroid function nec
P72.8|Other specified transitory neonatal endocrine disorders
P72.9|Transitory neonatal endocrine disorder, unspecified
P74|Other transitory neonatal electrolyte and metabolic disturbances
P74.0|Late metabolic acidosis of newborn
P74.1|Dehydration of newborn
P74.2|Disturbances of sodium balance of newborn
P74.3|Disturbances of potassium balance of newborn
P74.4|Other transitory electrolyte disturbances of newborn
P74.5|Transitory tyrosinaemia of newborn
P74.8|Other transitory metabolic disturbances of newborn
P74.9|Transitory metabolic disturbance of newborn, unspecified
P75|Meconium ileus
P76|Other intestinal obstruction of newborn
P76.0|Meconium plug syndrome
P76.1|Transitory ileus of newborn
P76.2|Intestinal obstruction due to inspissated milk
P76.8|Other specified intestinal obstruction of newborn
P76.9|Intestinal obstruction of newborn, unspecified
P77|Necrotizing enterocolitis of fetus and newborn
P78|Other perinatal digestive system disorders
P78.0|Perinatal intestinal perforation
P78.1|Other neonatal peritonitis
P78.2|Neonat haematemesis and melaena due swallow mat blood
P78.3|Noninfective neonatal diarrhoea
P78.8|Other specified perinatal digestive system disorders
P78.9|Perinatal digestive system disorder, unspecified
P80|Hypothermia of newborn
P80.0|Cold injury syndrome
P80.8|Other hypothermia of newborn
P80.9|Hypothermia of newborn, unspecified
P81|Other disturbances of temperature regulation of newborn
P81.0|Environmental hyperthermia of newborn
P81.8|Oth spec disturbances of temperature regulation of newborn
P81.9|Disturbance of temperature regulation of newborn
P83|Other conditions of integument specific to fetus and newborn
P83.0|Sclerema neonatorum
P83.1|Neonatal erythema toxicum
P83.2|Hydrops fetalis not due to haemolytic disease
P83.3|Other and unspecified oedema specific to fetus and newborn
P83.4|Breast engorgement of newborn
P83.5|Congenital hydrocele
P83.6|Umbilical polyp of newborn
P83.8|Other spec cond of integument specific to fetus and newborn
P83.9|Condition of integument specific to fetus and newborn uns
P90|Convulsions of newborn
P91|Other disturbances of cerebral status of newborn
P91.0|Neonatal cerebral ischaemia
P91.1|Acquired periventricular cysts of newborn
P91.2|Neonatal cerebral leukomalacia
P91.3|Neonatal cerebral irritability
P91.4|Neonatal cerebral depression
P91.5|Neonatal coma
P91.6|Hypoxic ischaemic encephalopathy of newborn
P91.8|Other specified disturbances of cerebral status of newborn
P91.9|Disturbance of cerebral status of newborn, unspecified
P92|Feeding problems of newborn
P92.0|Vomiting in newborn
P92.1|Regurgitation and rumination in newborn
P92.2|Slow feeding of newborn
P92.3|Underfeeding of newborn
P92.4|Overfeeding of newborn
P92.5|Neonatal difficulty in feeding at breast
P92.8|Other feeding problems of newborn
P92.9|Feeding problem of newborn, unspecified
P93|Reactions and intoxications due drug admin fet and newborn
P94|Disorders of muscle tone of newborn
P94.0|Transient neonatal myasthenia gravis
P94.1|Congenital hypertonia
P94.2|Congenital hypotonia
P94.8|Other disorders of muscle tone of newborn
P94.9|Disorder of muscle tone of newborn, unspecified
P96|Other conditions originating in the perinatal period
P96.0|Congenital renal failure
P96.1|Neonat withdrawal symptom from mat use of drug of addiction
P96.2|Withdrawal symptoms from therapeutic use of drugs in newborn
P96.3|Wide cranial sutures of newborn
P96.4|Termination of pregnancy, fetus and newborn
P96.5|Complicationss of intrauterine procedures nec
P96.8|Other spec conditions originating in the perinatal period
P96.9|Condition originating in the perinatal period, unspecified
Q00|Anencephaly and similar malformations
Q00.0|Anencephaly
Q00.1|Craniorachischisis
Q00.2|Iniencephaly
Q01|Encephalocele
Q01.0|Frontal encephalocele
Q01.1|Nasofrontal encephalocele
Q01.2|Occipital encephalocele
Q01.8|Encephalocele of other sites
Q01.9|Encephalocele, unspecified
Q02|Microcephaly
Q03|Congenital hydrocephalus
Q03.0|Malformations of aqueduct of sylvius
Q03.1|Atresia of foramina of magendie and luschka
Q03.8|Other congenital hydrocephalus
Q03.9|Congenital hydrocephalus, unspecified
Q04|Other congenital malformations of brain
Q04.0|Congenital malformations of corpus callosum
Q04.1|Arhinencephaly
Q04.2|Holoprosencephaly
Q04.3|Other reduction deformities of brain
Q04.4|Septo-optic dysplasia
Q04.5|Megalencephaly
Q04.6|Congenital cerebral cysts
Q04.8|Other specified congenital malformations of brain
Q04.9|Congenital malformation of brain, unspecified
Q05|Spina bifida
Q05.0|Cervical spina bifida with hydrocephalus
Q05.1|Thoracic spina bifida with hydrocephalus
Q05.2|Lumbar spina bifida with hydrocephalus
Q05.3|Sacral spina bifida with hydrocephalus
Q05.4|Unspecified spina bifida with hydrocephalus
Q05.5|Cervical spina bifida without hydrocephalus
Q05.6|Thoracic spina bifida without hydrocephalus
Q05.7|Lumbar spina bifida without hydrocephalus
Q05.8|Sacral spina bifida without hydrocephalus
Q05.9|Spina bifida, unspecified
Q06|Other congenital malformations of spinal cord
Q06.0|Amyelia
Q06.1|Hypoplasia and dysplasia of spinal cord
Q06.2|Diastematomyelia
Q06.3|Other congenital cauda equina malformations
Q06.4|Hydromyelia
Q06.8|Other specified congenital malformations of spinal cord
Q06.9|Congenital malformation of spinal cord, unspecified
Q07|Other congenital malformations of nervous system
Q07.0|Arnold-chiari syndrome
Q07.8|Other specified congenital malformations of nervous system
Q07.9|Congenital malformation of nervous system, unspecified
Q10|Congenital malformations of eyelid, lacrimal apparatus and orbit
Q10.0|Congenital ptosis
Q10.1|Congenital ectropion
Q10.2|Congenital entropion
Q10.3|Other congenital malformations of eyelid
Q10.4|Absence and agenesis of lacrimal apparatus
Q10.5|Congenital stenosis and stricture of lacrimal duct
Q10.6|Other congenital malformations of lacrimal apparatus
Q10.7|Congenital malformation of orbit
Q11|Anophthalmos, microphthalmos and macrophthalmos
Q11.0|Cystic eyeball
Q11.1|Other anophthalmos
Q11.2|Microphthalmos
Q11.3|Macrophthalmos
Q12|Congenital lens malformations
Q12.0|Congenital cataract
Q12.1|Congenital displaced lens
Q12.2|Coloboma of lens
Q12.3|Congenital aphakia
Q12.4|Spherophakia
Q12.8|Other congenital lens malformations
Q12.9|Congenital lens malformation, unspecified
Q13|Congenital malformations of anterior segment of eye
Q13.0|Coloboma of iris
Q13.1|Absence of iris
Q13.2|Other congenital malformations of iris
Q13.3|Congenital corneal opacity
Q13.4|Other congenital corneal malformations
Q13.5|Blue sclera
Q13.8|Other congenital malformations of anterior segment of eye
Q13.9|Congenital malformation of anterior segment of eye unspecified
Q14|Congenital malformations of posterior segment of eye
Q14.0|Congenital malformation of vitreous humour
Q14.1|Congenital malformation of retina
Q14.2|Congenital malformation of optic disc
Q14.3|Congenital malformation of choroid
Q14.8|Other congenital malformations of posterior segment of eye
Q14.9|Congenital malformation of posterior segment of eye unspecified
Q15|Other congenital malformations of eye
Q15.0|Congenital glaucoma
Q15.8|Other specified congenital malformations of eye
Q15.9|Congenital malformation of eye, unspecified
Q16|Congenital malformations of ear causing impairment of hearing
Q16.0|Congenital absence of (ear) auricle
Q16.1|Congenital absence atresia & stricture auditory canal (external)
Q16.2|Absence of eustachian tube
Q16.3|Congenital malformation of ear ossicles
Q16.4|Other congenital malformations of middle ear
Q16.5|Congenital malformation of inner ear
Q16.9|Congenital malform of ear causing impairment of hearing unspecified
Q17|Other congenital malformations of ear
Q17.0|Accessory auricle
Q17.1|Macrotia
Q17.2|Microtia
Q17.3|Other misshapen ear
Q17.4|Misplaced ear
Q17.5|Prominent ear
Q17.8|Other specified congenital malformations of ear
Q17.9|Congenital malformation of ear, unspecified
Q18|Other congenital malformations of face and neck
Q18.0|Sinus, fistula and cyst of branchial cleft
Q18.1|Preauricular sinus and cyst
Q18.2|Other branchial cleft malformations
Q18.3|Webbing of neck
Q18.4|Macrostomia
Q18.5|Microstomia
Q18.6|Macrocheilia
Q18.7|Microcheilia
Q18.8|Other specified congenital malformations of face and neck
Q18.9|Congenital malformation of face and neck, unspecified
Q20|Congenital malformations of cardiac chambers and connections
Q20.0|Common arterial trunk
Q20.1|Double outlet right ventricle
Q20.2|Double outlet left ventricle
Q20.3|Discordant ventriculoarterial connection
Q20.4|Double inlet ventricle
Q20.5|Discordant atrioventricular connection
Q20.6|Isomerism of atrial appendages
Q20.8|Other congenital malformations of cardiac chambers and connections
Q20.9|Congenital malformation of cardiac chambers and connections unspecified
Q21|Congenital malformations of cardiac septa
Q21.0|Ventricular septal defect
Q21.1|Atrial septal defect
Q21.2|Atrioventricular septal defect
Q21.3|Tetralogy of fallot
Q21.4|Aortopulmonary septal defect
Q21.8|Other congenital malformations of cardiac septa
Q21.9|Congenital malformation of cardiac septum, unspecified
Q22|Congenital malformations of pulmonary and tricuspid valves
Q22.0|Pulmonary valve atresia
Q22.1|Congenital pulmonary valve stenosis
Q22.2|Congenital pulmonary valve insufficiency
Q22.3|Other congenital malformations of pulmonary valve
Q22.4|Congenital tricuspid stenosis
Q22.5|Ebstein's anomaly
Q22.6|Hypoplastic right heart syndrome
Q22.8|Other congenital malformations of tricuspid valve
Q22.9|Congenital malformation of tricuspid valve, unspecified
Q23|Congenital malformations of aortic and mitral valves
Q23.0|Congenital stenosis of aortic valve
Q23.1|Congenital insufficiency of aortic valve
Q23.2|Congenital mitral stenosis
Q23.3|Congenital mitral insufficiency
Q23.4|Hypoplastic left heart syndrome
Q23.8|Other congenital malformations of aortic and mitral valves
Q23.9|Congenital malformation of aortic and mitral valves unspecified
Q24|Other congenital malformations of heart
Q24.0|Dextrocardia
Q24.1|Laevocardia
Q24.2|Cor triatriatum
Q24.3|Pulmonary infundibular stenosis
Q24.4|Congenital subaortic stenosis
Q24.5|Malformation of coronary vessels
Q24.6|Congenital heart block
Q24.8|Other specified congenital malformations of heart
Q24.9|Congenital malformation of heart, unspecified
Q25|Congenital malformations of great arteries
Q25.0|Patent ductus arteriosus
Q25.1|Coarctation of aorta
Q25.2|Atresia of aorta
Q25.3|Stenosis of aorta
Q25.4|Other congenital malformations of aorta
Q25.5|Atresia of pulmonary artery
Q25.6|Stenosis of pulmonary artery
Q25.7|Other congenital malformations of pulmonary artery
Q25.8|Other congenital malformations of great arteries
Q25.9|Congenital malformation of great arteries, unspecified
Q26|Congenital malformations of great veins
Q26.0|Congenital stenosis of vena cava
Q26.1|Persistent left superior vena cava
Q26.2|Total anomalous pulmonary venous connection
Q26.3|Partial anomalous pulmonary venous connection
Q26.4|Anomalous pulmonary venous connection, unspecified
Q26.5|Anomalous portal venous connection
Q26.6|Portal vein-hepatic artery fistula
Q26.8|Other congenital malformations of great veins
Q26.9|Congenital malformation of great vein, unspecified
Q27|Other congenital malformations of peripheral vascular system
Q27.0|Congenital absence and hypoplasia of umbilical artery
Q27.1|Congenital renal artery stenosis
Q27.2|Other congenital malformations of renal artery
Q27.3|Peripheral arteriovenous malformation
Q27.4|Congenital phlebectasia
Q27.8|Other specified congenitalo malformations of peripheral vascular system
Q27.9|Congenital malformation of peripheral vascular system unspecified
Q28|Other congenital malformations of circulatory system
Q28.0|Arteriovenous malformation of precerebral vessels
Q28.1|Other malformations of precerebral vessels
Q28.2|Arteriovenous malformation of cerebral vessels
Q28.3|Other malformations of cerebral vessels
Q28.8|Other specified congenital malformations of circulatory system
Q28.9|Congenital malformation of circulatory system, unspecified
Q30|Congenital malformations of nose
Q30.0|Choanal atresia
Q30.1|Agenesis and underdevelopment of nose
Q30.2|Fissured, notched and cleft nose
Q30.3|Congenital perforated nasal septum
Q30.8|Other congenital malformations of nose
Q30.9|Congenital malformation of nose, unspecified
Q31|Congenital malformations of larynx
Q31.0|Web of larynx
Q31.1|Congenital subglottic stenosis
Q31.2|Laryngeal hypoplasia
Q31.3|Laryngocele
Q31.4|Congenital laryngeal stridor
Q31.5|Congenital laryngomalacia
Q31.8|Other congenital malformations of larynx
Q31.9|Congenital malformation of larynx, unspecified
Q32|Congenital malformations of trachea and bronchus
Q32.0|Congenital tracheomalacia
Q32.1|Other congenital malformations of trachea
Q32.2|Congenital bronchomalacia
Q32.3|Congenital stenosis of bronchus
Q32.4|Other congenital malformations of bronchus
Q33|Congenital malformations of lung
Q33.0|Congenital cystic lung
Q33.1|Accessory lobe of lung
Q33.2|Sequestration of lung
Q33.3|Agenesis of lung
Q33.4|Congenital bronchiectasis
Q33.5|Ectopic tissue in lung
Q33.6|Hypoplasia and dysplasia of lung
Q33.8|Other congenital malformations of lung
Q33.9|Congenital malformation of lung, unspecified
Q34|Other congenital malformations of respiratory system
Q34.0|Anomaly of pleura
Q34.1|Congenital cyst of mediastinum
Q34.8|Other specified congenital malformations of respiratory system
Q34.9|Congenital malformation of respiratory system, unspecified
Q35|Cleft palate
Q35.0|Cleft hard palate, bilateral*
Q35.1|Cleft hard palate
Q35.2|Cleft soft palate, bilateral*
Q35.3|Cleft soft palate
Q35.4|Cleft hard palate with cleft soft palate, bilateral*
Q35.5|Cleft hard palate with cleft soft palate
Q35.6|Cleft palate, medial
Q35.7|Cleft uvula
Q35.8|Cleft palate, unspecified, bilateral*
Q35.9|Cleft palate, unspecified
Q36|Cleft lip
Q36.0|Cleft lip, bilateral
Q36.1|Cleft lip, median
Q36.9|Cleft lip, unilateral
Q37|Cleft palate with cleft lip
Q37.0|Cleft hard palate with  bilateral cleft lip
Q37.1|Cleft hard palate with  unilateral cleft lip
Q37.2|Cleft soft palate with bilateral  cleft lip
Q37.3|Cleft soft palate with unilateral cleft lip
Q37.4|Cleft hard and soft palate with bilateral cleft lip
Q37.5|Cleft hard and soft palate with  unilateral cleft lip
Q37.8|Unspecified cleft palate with bilateral cleft  lip
Q37.9|Unspecified cleft palate with unilateral cleft lip
Q38|Other congenital malformations of tongue, mouth and pharynx
Q38.0|Congenital malformations of lips, not elsewhere classified
Q38.1|Ankyloglossia
Q38.2|Macroglossia
Q38.3|Other congenital malformations of tongue
Q38.4|Congenital malformations of salivary glands and ducts
Q38.5|Congenital malformations of palate, not elsewhere classified
Q38.6|Other congenital malformations of mouth
Q38.7|Pharyngeal pouch
Q38.8|Other congenital malformations of pharynx
Q39|Congenital malformations of oesophagus
Q39.0|Atresia of oesophagus without fistula
Q39.1|Atresia of oesophagus with tracheo-oesophageal fistula
Q39.2|Congenital tracheo-oesophageal fistula without atresia
Q39.3|Congenital stenosis and stricture of oesophagus
Q39.4|Oesophageal web
Q39.5|Congenital dilatation of oesophagus
Q39.6|Diverticulum of oesophagus
Q39.8|Other congenital malformations of oesophagus
Q39.9|Congenital malformation of oesophagus, unspecified
Q40|Other congenital malformations of upper alimentary tract
Q40.0|Congenital hypertrophic pyloric stenosis
Q40.1|Congenital hiatus hernia
Q40.2|Other specified congenital malformations of stomach
Q40.3|Congenital malformation of stomach, unspecified
Q40.8|Other specified congenital malforms of upper alimentary tract
Q40.9|Congenital malformation of upper alimentary tract, unspecified
Q41|Congenital absence, atresia and stenosis of small intestine
Q41.0|Congenital absence, atresia and stenosis of duodenum
Q41.1|Congenital absence, atresia and stenosis of jejunum
Q41.2|Congenital absence, atresia and stenosis of ileum
Q41.8|Congenital absence atresia stenosis other specified parts small intestine
Q41.9|Congenital absence atresia and stenosis small intestine part unspecified
Q42|Congenital absence, atresia and stenosis of large intestine
Q42.0|Congenital absence atresia and stenosis of rectum with fistula
Q42.1|Congenital absence atresia and stenosis rectum without fistula
Q42.2|Congenital absence atresia and stenosis anus with fistula
Q42.3|Congenital  absence atresia and stenosis anus without fistula
Q42.8|Congenital absence atresia and stenosis other parts of large intest
Q42.9|Congenital absce atresia and sten of large intest part unspecified
Q43|Other congenital malformations of intestine
Q43.0|Meckel's diverticulum
Q43.1|Hirschsprung's disease
Q43.2|Other congenital functional disorders of colon
Q43.3|Congenital malformations of intestinal fixation
Q43.4|Duplication of intestine
Q43.5|Ectopic anus
Q43.6|Congenital fistula of rectum and anus
Q43.7|Persistent cloaca
Q43.8|Other specified congenital malformations of intestine
Q43.9|Congenital malformation of intestine, unspecified
Q44|Congenital malformations of gallbladder, bile ducts and liver
Q44.0|Agenesis, aplasia and hypoplasia of gallbladder
Q44.1|Other congenital malformations of gallbladder
Q44.2|Atresia of bile ducts
Q44.3|Congenital stenosis and stricture of bile ducts
Q44.4|Choledochal cyst
Q44.5|Other congenital malformations of bile ducts
Q44.6|Cystic disease of liver
Q44.7|Other congenital malformations of liver
Q45|Other congenital malformations of digestive system
Q45.0|Agenesis, aplasia and hypoplasia of pancreas
Q45.1|Annular pancreas
Q45.2|Congenital pancreatic cyst
Q45.3|Other congenital malformations of pancreas and pancreatic duct
Q45.8|Other specified congenital malformations of digestive system
Q45.9|Congenital malformation of digestive system, unspecified
Q50|Congenital malformations of ovaries, fallopian tubes and broad ligaments
Q50.0|Congenital absence of ovary
Q50.1|Developmental ovarian cyst
Q50.2|Congenital torsion of ovary
Q50.3|Other congenital malformations of ovary
Q50.4|Embryonic cyst of fallopian tube
Q50.5|Embryonic cyst of broad ligament
Q50.6|Other congenital malformations of fallopian tube and broad ligament
Q51|Congenital malformations of uterus and cervix
Q51.0|Agenesis and aplasia of uterus
Q51.1|Doubling of uterus with doubling of cervix and vagina
Q51.2|Other doubling of uterus
Q51.3|Bicornate uterus
Q51.4|Unicornate uterus
Q51.5|Agenesis and aplasia of cervix
Q51.6|Embryonic cyst of cervix
Q51.7|Congenital fistulae btwn uterus and digestive and urinary tracts
Q51.8|Other congenital malformations of uterus and cervix
Q51.9|Congenital malformation of uterus and cervix, unspecified
Q52|Other congenital malformations of female genitalia
Q52.0|Congenital absence of vagina
Q52.1|Doubling of vagina
Q52.2|Congenital rectovaginal fistula
Q52.3|Imperforate hymen
Q52.4|Other congenital malformations of vagina
Q52.5|Fusion of labia
Q52.6|Congenital malformation of clitoris
Q52.7|Other congenital malformations of vulva
Q52.8|Other specified congenital malformations of female genitalia
Q52.9|Congenital malformation of female genitalia, unspecified
Q53|Undescended testicle
Q53.0|Ectopic testis
Q53.1|Undescended testicle, unilateral
Q53.2|Undescended testicle, bilateral
Q53.9|Undescended testicle, unspecified
Q54|Hypospadias
Q54.0|Hypospadias, balanic
Q54.1|Hypospadias, penile
Q54.2|Hypospadias, penoscrotal
Q54.3|Hypospadias, perineal
Q54.4|Congenital chordee
Q54.8|Other hypospadias
Q54.9|Hypospadias, unspecified
Q55|Other congenital malformations of male genital organs
Q55.0|Absence and aplasia of testis
Q55.1|Hypoplasia of testis and scrotum
Q55.2|Other congenital malformations of testis and scrotum
Q55.3|Atresia of vas deferens
Q55.4|Other congenital malformations vas deferens, epididymis seminal vesicles and prostate
Q55.5|Congenital absence and aplasia of penis
Q55.6|Other congenital malformations of penis
Q55.8|Other specified congen malformations of male genital organs
Q55.9|Congenital malformation of male genital organ, unspecified
Q56|Indeterminate sex and pseudohermaphroditism
Q56.0|Hermaphroditism, not elsewhere classified
Q56.1|Male pseudohermaphroditism, not elsewhere classified
Q56.2|Female pseudohermaphroditism, not elsewhere classified
Q56.3|Pseudohermaphroditism, unspecified
Q56.4|Indeterminate sex, unspecified
Q60|Renal agenesis and other reduction defects of kidney
Q60.0|Renal agenesis, unilateral
Q60.1|Renal agenesis, bilateral
Q60.2|Renal agenesis, unspecified
Q60.3|Renal hypoplasia, unilateral
Q60.4|Renal hypoplasia, bilateral
Q60.5|Renal hypoplasia, unspecified
Q60.6|Potter's syndrome
Q61|Cystic kidney disease
Q61.0|Congenital single renal cyst
Q61.1|Polycystic kidney, autosomal recessive
Q61.2|Polycystic kidney, autosomal dominant
Q61.3|Polycystic kidney, unspecified
Q61.4|Renal dysplasia
Q61.5|Medullary cystic kidney
Q61.8|Other cystic kidney diseases
Q61.9|Cystic kidney disease, unspecified
Q62|Congenital obstructive defects of renal pelvis and congenital malformations of ureter
Q62.0|Congenital hydronephrosis
Q62.1|Atresia and stenosis of ureter
Q62.2|Congenital megaloureter
Q62.3|Other obstructive defects of renal pelvis and ureter
Q62.4|Agenesis of ureter
Q62.5|Duplication of ureter
Q62.6|Malposition of ureter
Q62.7|Congenital vesico-uretero-renal reflux
Q62.8|Other congenital malformations of ureter
Q63|Other congenital malformations of kidney
Q63.0|Accessory kidney
Q63.1|Lobulated, fused and horseshoe kidney
Q63.2|Ectopic kidney
Q63.3|Hyperplastic and giant kidney
Q63.8|Other specified congenital malformations of kidney
Q63.9|Congenital malformation of kidney, unspecified
Q64|Other congenital malformations of urinary system
Q64.0|Epispadias
Q64.1|Exstrophy of urinary bladder
Q64.2|Congenital posterior urethral valves
Q64.3|Other atresia and stenosis of urethra and bladder neck
Q64.4|Malformation of urachus
Q64.5|Congenital absence of bladder and urethra
Q64.6|Congenital diverticulum of bladder
Q64.7|Other congenital malformations of bladder and urethra
Q64.8|Other specified congenital malformations of urinary system
Q64.9|Congenital malformation of urinary system, unspecified
Q65|Congenital deformities of hip
Q65.0|Congenital dislocation of hip, unilateral
Q65.1|Congenital dislocation of hip, bilateral
Q65.2|Congenital dislocation of hip, unspecified
Q65.3|Congenital subluxation of hip, unilateral
Q65.4|Congenital subluxation of hip, bilateral
Q65.5|Congenital subluxation of hip, unspecified
Q65.6|Unstable hip
Q65.8|Other congenital deformities of hip
Q65.9|Congenital deformity of hip, unspecified
Q66|Congenital deformities of feet
Q66.0|Talipes equinovarus
Q66.1|Talipes calcaneovarus
Q66.2|Metatarsus varus
Q66.3|Other congenital varus deformities of feet
Q66.4|Talipes calcaneovalgus
Q66.5|Congenital pes planus
Q66.6|Other congenital valgus deformities of feet
Q66.7|Pes cavus
Q66.8|Other congenital deformities of feet
Q66.9|Congenital deformity of feet, unspecified
Q67|Congenital musculoskeletal deformities of head, face, spine and chest
Q67.0|Facial asymmetry
Q67.1|Compression facies
Q67.2|Dolichocephaly
Q67.3|Plagiocephaly
Q67.4|Other congenital deformities of skull, face and jaw
Q67.5|Congenital deformity of spine
Q67.6|Pectus excavatum
Q67.7|Pectus carinatum
Q67.8|Other congenital deformities of chest
Q68|Other congenital musculoskeletal deformities
Q68.0|Congenital deformity of sternocleidomastoid muscle
Q68.1|Congenital deformity of hand
Q68.2|Congenital deformity of knee
Q68.3|Congenital bowing of femur
Q68.4|Congenital bowing of tibia and fibula
Q68.5|Congenital bowing of long bones of leg, unspecified
Q68.8|Other specified congenital musculoskeletal deformities
Q69|Polydactyly
Q69.0|Accessory finger(s)
Q69.1|Accessory thumb(s)
Q69.2|Accessory toe(s)
Q69.9|Polydactyly, unspecified
Q70|Syndactyly
Q70.0|Fused fingers
Q70.1|Webbed fingers
Q70.2|Fused toes
Q70.3|Webbed toes
Q70.4|Polysyndactyly
Q70.9|Syndactyly, unspecified
Q71|Reduction defects of upper limb
Q71.0|Congenital complete absence of upper limb(s)
Q71.1|Cong absence of upper arm and forearm with hand present
Q71.2|Congenital absence of both forearm and hand
Q71.3|Congenital absence of hand and finger(s)
Q71.4|Longitudinal reduction defect of radius
Q71.5|Longitudinal reduction defect of ulna
Q71.6|Lobster-claw hand
Q71.8|Other reduction defects of upper limb(s)
Q71.9|Reduction defect of upper limb, unspecified
Q72|Reduction defects of lower limb
Q72.0|Congenital complete absence of lower limb(s)
Q72.1|Congenital absence of thigh and lower leg with foot present
Q72.2|Congenital absence of both lower leg and foot
Q72.3|Congenital absence of foot and toe(s)
Q72.4|Longitudinal reduction defect of femur
Q72.5|Longitudinal reduction defect of tibia
Q72.6|Longitudinal reduction defect of fibula
Q72.7|Split foot
Q72.8|Other reduction defects of lower limb(s)
Q72.9|Reduction defect of lower limb, unspecified
Q73|Reduction defects of unspecified limb
Q73.0|Congenital absence of unspecified limb(s)
Q73.1|Phocomelia, unspecified limb(s)
Q73.8|Other reduction defects of unspecified limb(s)
Q74|Other congenital malformations of limb(s)
Q74.0|Other congenital malformation of upper limb(s) including shoulder girdle
Q74.1|Congenital malformation of knee
Q74.2|Other congenital malformation of lower limb(s) including pelvic girdle
Q74.3|Arthrogryposis multiplex congenita
Q74.8|Other specified congenital malformations of limb(s)
Q74.9|Unspecified congenital malformation of limb(s)
Q75|Other congenital malformations of skull and face bones
Q75.0|Craniosynostosis
Q75.1|Craniofacial dysostosis
Q75.2|Hypertelorism
Q75.3|Macrocephaly
Q75.4|Mandibulofacial dysostosis
Q75.5|Oculomandibular dysostosis
Q75.8|Other specified congenital malformations of skull and face bones
Q75.9|Congenital malformation of skull and face bones, unspecified
Q76|Congenital malformations of spine and bony thorax
Q76.0|Spina bifida occulta
Q76.1|Klippel-feil syndrome
Q76.2|Congenital spondylolisthesis
Q76.3|Congenital scoliosis due to congenital bony malformation
Q76.4|Other congenital malformation of spine not associated with scoliosis
Q76.5|Cervical rib
Q76.6|Other congenital malformations of ribs
Q76.7|Congenital malformation of sternum
Q76.8|Other congenital malformations of bony thorax
Q76.9|Congenital malformation of bony thorax, unspecified
Q77|Osteochondrodysplasia with defects of growth of tubular bones and spine
Q77.0|Achondrogenesis
Q77.1|Thanatophoric short stature
Q77.2|Short rib syndrome
Q77.3|Chondrodysplasia punctata
Q77.4|Achondroplasia
Q77.5|Dystrophic dysplasia
Q77.6|Chondroectodermal dysplasia
Q77.7|Spondyloepiphyseal dysplasia
Q77.8|Other osteochondrodysplas with defect growth tubular bone spine
Q77.9|Osteochondrodyspl with defect growth tubular bones and spine, unspecified
Q78|Other osteochondrodysplasias
Q78.0|Osteogenesis imperfecta
Q78.1|Polyostotic fibrous dysplasia
Q78.2|Osteopetrosis
Q78.3|Progressive diaphyseal dysplasia
Q78.4|Enchondromatosis
Q78.5|Metaphyseal dysplasia
Q78.6|Multiple congenital exostoses
Q78.8|Other specified osteochondrodysplasias
Q78.9|Osteochondrodysplasia, unspecified
Q79|Congenital malformations of the musculoskeletal system, not elsewhere classified
Q79.0|Congenital diaphragmatic hernia
Q79.1|Other congenital malformations of diaphragm
Q79.2|Exomphalos
Q79.3|Gastroschisis
Q79.4|Prune belly syndrome
Q79.5|Other congenital malformations of abdominal wall
Q79.6|Ehlers-danlos syndrome
Q79.8|Other congenital malformations of musculoskeletal system
Q79.9|Congenital malformation of musculoskeletal system unspecified
Q80|Congenital ichthyosis
Q80.0|Ichthyosis vulgaris
Q80.1|X-linked ichthyosis
Q80.2|Lamellar ichthyosis
Q80.3|Congenital bullous ichthyosiform erythroderma
Q80.4|Harlequin fetus
Q80.8|Other congenital ichthyosis
Q80.9|Congenital ichthyosis, unspecified
Q81|Epidermolysis bullosa
Q81.0|Epidermolysis bullosa simplex
Q81.1|Epidermolysis bullosa letalis
Q81.2|Epidermolysis bullosa dystrophica
Q81.8|Other epidermolysis bullosa
Q81.9|Epidermolysis bullosa, unspecified
Q82|Other congenital malformations of skin
Q82.0|Hereditary lymphoedema
Q82.1|Xeroderma pigmentosum
Q82.2|Mastocytosis
Q82.3|Incontinentia pigmenti
Q82.4|Ectodermal dysplasia (anhidrotic)
Q82.5|Congenital non-neoplastic naevus
Q82.8|Other specified congenital malformations of skin
Q82.9|Congenital malformation of skin, unspecified
Q83|Congenital malformations of breast
Q83.0|Congenital absence of breast with absent nipple
Q83.1|Accessory breast
Q83.2|Absent nipple
Q83.3|Accessory nipple
Q83.8|Other congenital malformations of breast
Q83.9|Congenital malformation of breast, unspecified
Q84|Other congenital malformations of integument
Q84.0|Congenital alopecia
Q84.1|Congenital morphological disturbances of hair nec
Q84.2|Other congenital malformations of hair
Q84.3|Anonychia
Q84.4|Congenital leukonychia
Q84.5|Enlarged and hypertrophic nails
Q84.6|Other congenital malformations of nails
Q84.8|Other specified congenital malformations of integument
Q84.9|Congenital malformation of integument, unspecified
Q85|Phakomatoses, not elsewhere classified
Q85.0|Neurofibromatosis (nonmalignant)
Q85.1|Tuberous sclerosis
Q85.8|Other phakomatoses, not elsewhere classified
Q85.9|Phakomatosis, unspecified
Q86|Congenital malformation syndromes due to known exogenous causes, not elsewhere classified
Q86.0|Fetal alcohol syndrome (dysmorphic)
Q86.1|Fetal hydantoin syndrome
Q86.2|Dysmorphism due to warfarin
Q86.8|Other congenital malformation syndromes due to known exogen causes
Q87|Other specified congenital malformation syndromes affecting multiple systems
Q87.0|Congenital malformation syndromes predominantly affect facial appearance
Q87.1|Congenital malformation syndromes predominantly associated with short stature
Q87.2|Congenital malformation syndromes predominantly involving limbs
Q87.3|Congenital malformation syndromes involving early overgrowth
Q87.4|Marfan's syndrome
Q87.5|Other congenital malformation syndromes with other skeletal changes
Q87.8|Other specified congenital malformation syndromes NEC
Q89|Other congenital malformations, not elsewhere classified
Q89.0|Congenital malformations of spleen
Q89.1|Congenital malformations of adrenal gland
Q89.2|Congenital malformations of other endocrine glands
Q89.3|Situs inversus
Q89.4|Conjoined twins
Q89.7|Multiple congenital malformations, not elsewhere classified
Q89.8|Other specified congenital malformations
Q89.9|Congenital malformation, unspecified
Q90|Down syndrome
Q90.0|Trisomy 21, meiotic nondisjunction
Q90.1|Trisomy 21, mosaicism (mitotic nondisjunction)
Q90.2|Trisomy 21, translocation
Q90.9|Down's syndrome, unspecified
Q91|Edwards syndrome and Patau syndrome
Q91.0|Trisomy 18, meiotic nondisjunction
Q91.1|Trisomy 18, mosaicism (mitotic nondisjunction)
Q91.2|Trisomy 18, translocation
Q91.3|Edwards' syndrome, unspecified
Q91.4|Trisomy 13, meiotic nondisjunction
Q91.5|Trisomy 13, mosaicism (mitotic nondisjunction)
Q91.6|Trisomy 13, translocation
Q91.7|Patau's syndrome, unspecified
Q92|Other trisomies and partial trisomies of the autosomes, not elsewhere classified
Q92.0|Whole chromosome trisomy, meiotic nondisjunction
Q92.1|Whole chromosome trisomy, mosaicism (mitotic nondisjunction)
Q92.2|Major partial trisomy
Q92.3|Minor partial trisomy
Q92.4|Duplications seen only at prometaphase
Q92.5|Duplications with other complex rearrangements
Q92.6|Extra marker chromosomes
Q92.7|Triploidy and polyploidy
Q92.8|Other specified trisomies and partial trisomies of autosomes
Q92.9|Trisomy and partial trisomy of autosomes, unspecified
Q93|Monosomies and deletions from the autosomes, not elsewhere classified
Q93.0|Whole chromosome monosomy, meiotic nondisjunction
Q93.1|Whole chrom monosomy mosaicism (mitotic nondisjunction)
Q93.2|Chromosome replaced with ring or dicentric
Q93.3|Deletion of short arm of chromosome 4
Q93.4|Deletion of short arm of chromosome 5
Q93.5|Other deletions of part of a chromosome
Q93.6|Deletions seen only at prometaphase
Q93.7|Deletions with other complex rearrangements
Q93.8|Other deletions from the autosomes
Q93.9|Deletion from autosomes, unspecified
Q95|Balanced rearrangements and structural markers, not elsewhere classified
Q95.0|Balanced translocation and insertion in normal individual
Q95.1|Chromosome inversion in normal individual
Q95.2|Balanced autosomal rearrangement in abnormal individual
Q95.3|Balanced sex/autosomal rearrangement in abnormal individual
Q95.4|Individuals with marker heterochromatin
Q95.5|Individuals with autosomal fragile site
Q95.8|Other balanced rearrangements and structural markers
Q95.9|Balanced rearrangement and structural marker, unspecified
Q96|Turner syndrome
Q96.0|Karyotype 45x
Q96.1|Karyotype 46x iso (xq)
Q96.2|Karyotype 46x with abnormal sex chromosome, except iso (Xq)
Q96.3|Mosaicism, 45, x/46, xx or xy
Q96.4|Mosaicism 45x/oth cell line(s) with abnorm sex chromosome
Q96.8|Other variants of turner's syndrome
Q96.9|Turner's syndrome, unspecified
Q97|Other sex chromosome abnormalities, female phenotype, not elsewhere classified
Q97.0|Karotype 47, XXX
Q97.1|Female with more than three x chromosomes
Q97.2|Mosaicism, lines with various numbers of x chromosomes
Q97.3|Female with 46, XY karyotype
Q97.8|Other specified sex chromosome abnormalities female phrenotype
Q97.9|Sex chromosome abnormality, female phenotype, unspecified
Q98|Other sex chromosome abnormalities, male phenotype, not elsewhere classified
Q98.0|Klinefelters syndrome karyotype 47, XXY
Q98.1|Klinefelters syndrome male with more than two X chromosomes
Q98.2|Klinefelters syndrome karyotype male with 46, XX karyotype
Q98.3|Other male with 46 XX karyotype
Q98.4|Klinefelter's syndrome, unspecified
Q98.5|Karyotype 47 , XYY
Q98.6|Male with structurally abnormal sex chromosome
Q98.7|Male with sex chromosome mosaicism
Q98.8|Other specified sex chromosome abnormalities, male phenotype
Q98.9|Sex chromosome abnormality, male phenotype, unspecified
Q99|Other chromosome abnormalities, not elsewhere classified
Q99.0|Chimera 46, XX/46, XY
Q99.1|46, XX true hemaphrodite
Q99.2|Fragile x chromosome
Q99.8|Other specified chromosome abnormalities
Q99.9|Chromosomal abnormality, unspecified
R00|Abnormalities of heart beat
R00.0|Tachycardia, unspecified
R00.1|Bradycardia, unspecified
R00.2|Palpitations
R00.8|Other and unspecified abnormalities of heart beat
R01|Cardiac murmurs and other cardiac sounds
R01.0|Benign and innocent cardiac murmurs
R01.1|Cardiac murmur, unspecified
R01.2|Other cardiac sounds
R02|Gangrene, not elsewhere classified
R03|Abnormal blood-pressure reading, without diagnosis
R03.0|Elevated blood-pressure reading without diagnosis of hypertension
R03.1|Nonspecific low blood-pressure reading
R04|Haemorrhage from respiratory passages
R04.0|Epistaxis
R04.1|Haemorrhage from throat
R04.2|Haemoptysis
R04.8|Haemorrhage from other sites in respiratory passages
R04.9|Haemorrhage from respiratory passages, unspecified
R05|Cough
R06|Abnormalities of breathing
R06.0|Dyspnoea
R06.1|Stridor
R06.2|Wheezing
R06.3|Periodic breathing
R06.4|Hyperventilation
R06.5|Mouth breathing
R06.6|Hiccough
R06.7|Sneezing
R06.8|Other and unspecified abnormalities of breathing
R07|Pain in throat and chest
R07.0|Pain in throat
R07.1|Chest pain on breathing
R07.2|Precordial pain
R07.3|Other chest pain
R07.4|Chest pain, unspecified
R09|Other symptoms and signs involving the circulatory and respiratory systems
R09.0|Asphyxia
R09.1|Pleurisy
R09.2|Respiratory arrest
R09.3|Abnormal sputum
R09.8|Other specified symptoms and signs involving circulatory and respiratory systems
R10|Abdominal and pelvic pain
R10.0|Acute abdomen
R10.1|Pain localized to upper abdomen
R10.2|Pelvic and perineal pain
R10.3|Pain localized to other parts of lower abdomen
R10.4|Other and unspecified abdominal pain
R11|Nausea and vomiting
R12|Heartburn
R13|Dysphagia
R14|Flatulence and related conditions
R15|Faecal incontinence
R16|Hepatomegaly and splenomegaly, not elsewhere classified
R16.0|Hepatomegaly, not elsewhere classified
R16.1|Splenomegaly, not elsewhere classified
R16.2|Hepatomegaly with splenomegaly, not elsewhere classified
R17|Unspecified jaundice
R18|Ascites
R19|Other symptoms and signs involving the digestive system and abdomen
R19.0|Intra-abdominal and pelvic swelling, mass and lump
R19.1|Abnormal bowel sounds
R19.2|Visible peristalsis
R19.3|Abdominal rigidity
R19.4|Change in bowel habit
R19.5|Other faecal abnormalities
R19.6|Halitosis
R19.8|Other specified symptoms and signs involving digestive system and abdomen
R20|Disturbances of skin sensation
R20.0|Anaesthesia of skin
R20.1|Hypoaesthesia of skin
R20.2|Paraesthesia of skin
R20.3|Hyperaesthesia
R20.8|Other and unspecified disturbances of skin sensation
R21|Rash and other nonspecific skin eruption
R22|Localized swelling, mass and lump of skin and subcutaneous tissue
R22.0|Localized swelling, mass and lump, head
R22.1|Localized swelling, mass and lump, neck
R22.2|Localized swelling, mass and lump, trunk
R22.3|Localized swelling, mass and lump, upper limb
R22.4|Localized swelling, mass and lump, lower limb
R22.7|Localized swelling, mass and lump, multiple sites
R22.9|Localized swelling, mass and lump, unspecified
R23|Other skin changes
R23.0|Cyanosis
R23.1|Pallor
R23.2|Flushing
R23.3|Spontaneous ecchymoses
R23.4|Changes in skin texture
R23.8|Other and unspecified skin changes
R25|Abnormal involuntary movements
R25.0|Abnormal head movements
R25.1|Tremor, unspecified
R25.2|Cramp and spasm
R25.3|Fasciculation
R25.8|Other and unspecified abnormal involuntary movements
R26|Abnormalities of gait and mobility
R26.0|Ataxic gait
R26.1|Paralytic gait
R26.2|Difficulty in walking, not elsewhere classified
R26.3|Immobility
R26.8|Other and unspecified abnormalities of gait and mobility
R27|Other lack of coordination
R27.0|Ataxia, unspecified
R27.8|Other and unspecified lack of coordination
R29|Other symptoms and signs involving the nervous and musculoskeletal systems
R29.0|Tetany
R29.1|Meningismus
R29.2|Abnormal reflex
R29.3|Abnormal posture
R29.4|Clicking hip
R29.6|Tendency to fall, NEC
R29.8|Other unspecified symptoms and signs involving the nervous and musculoskel systems
R30|Pain associated with micturition
R30.0|Dysuria
R30.1|Vesical tenesmus
R30.9|Painful micturition, unspecified
R31|Unspecified haematuria
R32|Unspecified urinary incontinence
R33|Retention of urine
R34|Anuria and oliguria
R35|Polyuria
R36|Urethral discharge
R39|Other symptoms and signs involving the urinary system
R39.0|Extravasation of urine
R39.1|Other difficulties with micturition
R39.2|Extrarenal uraemia
R39.8|Other and unspecified symptoms and signs involving urinary system
R40|Somnolence, stupor and coma
R40.0|Somnolence
R40.1|Stupor
R40.2|Coma, unspecified
R41|Other symptoms and signs involving cognitive functions and awareness
R41.0|Disorientation, unspecified
R41.1|Anterograde amnesia
R41.2|Retrograde amnesia
R41.3|Other amnesia
R41.8|Other and unspecified symptoms and signs involving cognitive functions and awareness
R42|Dizziness and giddiness
R43|Disturbances of smell and taste
R43.0|Anosmia
R43.1|Parosmia
R43.2|Parageusia
R43.8|Other and unspecified disturbances of smell and taste
R44|Other symptoms and signs involving general sensations and perceptions
R44.0|Auditory hallucinations
R44.1|Visual hallucinations
R44.2|Other hallucinations
R44.3|Hallucinations, unspecified
R44.8|Other and unspecified symptoms and signs involving  general sensations and perceptions
R45|Symptoms and signs involving emotional state
R45.0|Nervousness
R45.1|Restlessness and agitation
R45.2|Unhappiness
R45.3|Demoralization and apathy
R45.4|Irritability and anger
R45.5|Hostility
R45.6|Physical violence
R45.7|State of emotional shock and stress, unspecified
R45.8|Other symptoms and signs involving emotional state
R46|Symptoms and signs involving appearance and behaviour
R46.0|Very low level of personal hygiene
R46.1|Bizarre personal appearance
R46.2|Strange and inexplicable behaviour
R46.3|Overactivity
R46.4|Slowness and poor responsiveness
R46.5|Suspiciousness and marked evasiveness
R46.6|Undue concern and preoccupation with stressful events
R46.7|Verbosity and circumstantial detail obscuring reason for contact
R46.8|Other symptoms and signs involving appearance and behaviour
R47|Speech disturbances, not elsewhere classified
R47.0|Dysphasia and aphasia
R47.1|Dysarthria and anarthria
R47.8|Other and unspecified speech disturbances
R48|Dyslexia and other symbolic dysfunctions, not elsewhere classified
R48.0|Dyslexia and alexia
R48.1|Agnosia
R48.2|Apraxia
R48.8|Other and unspecified symbolic dysfunctions
R49|Voice disturbances
R49.0|Dysphonia
R49.1|Aphonia
R49.2|Hypernasality and hyponasality
R49.8|Other and unspecified voice disturbances
R50|Fever of other and unknown origin
R50.2|Drug-induced fever
R50.8|Other specified fever
R50.9|Fever, unspecified
R51|Headache
R52|Pain, not elsewhere classified
R52.0|Acute pain
R52.1|Chronic intractable pain
R52.2|Other chronic pain
R52.9|Pain, unspecified
R53|Malaise and fatigue
R54|Senility
R55|Syncope and collapse
R56|Convulsions, not elsewhere classified
R56.0|Febrile convulsions
R56.8|Other and unspecified convulsions
R57|Shock, not elsewhere classified
R57.0|Cardiogenic shock
R57.1|Hypovolaemic shock
R57.2|Septic shock
R57.8|Other shock
R57.9|Shock, unspecified
R58|Haemorrhage, not elsewhere classified
R59|Enlarged lymph nodes
R59.0|Localized enlarged lymph nodes
R59.1|Generalized enlarged lymph nodes
R59.9|Enlarged lymph nodes, unspecified
R60|Oedema, not elsewhere classified
R60.0|Localized oedema
R60.1|Generalized oedema
R60.9|Oedema, unspecified
R61|Hyperhidrosis
R61.0|Localized hyperhidrosis
R61.1|Generalized hyperhidrosis
R61.9|Hyperhidrosis, unspecified
R62|Lack of expected normal physiological development
R62.0|Delayed milestone
R62.8|Other lack of expected normal physiological development
R62.9|Lack of expected normal physiologic developmemnt unspecified
R63|Symptoms and signs concerning food and fluid intake
R63.0|Anorexia
R63.1|Polydipsia
R63.2|Polyphagia
R63.3|Feeding difficulties and mismanagement
R63.4|Abnormal weight loss
R63.5|Abnormal weight gain
R63.6|Insufficient intake of food and water due to self neglect
R63.8|Other symptoms and signs concerning food and fluid intake
R64|Cachexia
R65|Systemic Inflammatory Response Syndrome [SIRS]
R65.0|Systemic Inflammatory Response Syndrome of infectious origin without organ failure
R65.1|Systemic Inflammatory Response Syndrome of infectious origin with organ failure
R65.2|Systemic Inflammatory Response Syndrome of non-infectious origin without organ failure
R65.3|Systemic Inflammatory Response Syndrome of non-infectious origin with organ failure
R65.9|Systemic Inflammatory Response Syndrome, unspecified
R68|Other general symptoms and signs
R68.0|Hypothermia not associated with low environmental temperature
R68.1|Nonspecific symptoms peculiar to infancy
R68.2|Dry mouth, unspecified
R68.3|Clubbing of fingers
R68.8|Other specified general symptoms and signs
R69|Unknown and unspecified causes of morbidity
R70|Elevated erythrocyte sedimentation rate and abnormality of plasma viscosity
R70.0|Elevated erythrocyte sedimentation rate
R70.1|Abnormal plasma viscosity
R71|Abnormality of red blood cells
R72|Abnormality of white blood cells, not elsewhere classified
R73|Elevated blood glucose level
R73.0|Abnormal glucose tolerance test
R73.9|Hyperglycaemia, unspecified
R74|Abnormal serum enzyme levels
R74.0|Elevated levels of transaminase & lactic acid dehydrogenase
R74.8|Abnormal levels of other serum enzymes
R74.9|Abnormal level of unspecified serum enzyme
R75|Laboratory evidence of human immunodeficiency virus [hiv]
R76|Other abnormal immunological findings in serum
R76.0|Raised antibody titre
R76.1|Abnormal reaction to tuberculin test
R76.2|False-positive serological test for syphilis
R76.8|Other specified abnormal immunological findings in serum
R76.9|Abnormal immunological finding in serum, unspecified
R77|Other abnormalities of plasma proteins
R77.0|Abnormality of albumin
R77.1|Abnormality of globulin
R77.2|Abnormality of alphafetoprotein
R77.8|Other specified abnormalities of plasma proteins
R77.9|Abnormality of plasma protein, unspecified
R78|Findings of drugs and other substances, not normally found in blood
R78.0|Finding of alcohol in blood
R78.1|Finding of opiate drug in blood
R78.2|Finding of cocaine in blood
R78.3|Finding of hallucinogen in blood
R78.4|Finding of other drugs of addictive potential in blood
R78.5|Finding of psychotropic drug in blood
R78.6|Finding of steroid agent in blood
R78.7|Finding of abnormal level of heavy metals in blood
R78.8|Finding of other specified substance not normally found in blood
R78.9|Finding of unspecified substance not normally found in blood
R79|Other abnormal findings of blood chemistry
R79.0|Abnormal level of blood mineral
R79.8|Other specified abnormal findings of blood chemistry
R79.9|Abnormal finding of blood chemistry, unspecified
R80|Isolated proteinuria
R81|Glycosuria
R82|Other abnormal findings in urine
R82.0|Chyluria
R82.1|Myoglobinuria
R82.2|Biliuria
R82.3|Haemoglobinuria
R82.4|Acetonuria
R82.5|Elevated urine levels of drugs, medicaments and biolog substance
R82.6|Abnormal urine levels of substance chiefly nonmedicinal as to sources
R82.7|Abnormal findings on microbiological examination of urine
R82.8|Abnormal find on cytological and histological examination of urine
R82.9|Other and unspecified abnormal findings in urine
R83|Abnormal findings in cerebrospinal fluid
R83.0|Abnormal findings in cerebrospinal fluid, abnormal level of enzymes
R83.1|Abnormal findings in cerebrospinal fluid, abnormal level of hormones
R83.2|Abnormal findings in cerebrospinal fluid, abnormal level other drugs,  medicaments and biological substance
R83.3|Abnormal findings in cerebrospinal fluid, abnormal level substance chiefly nonmedicinal as to source
R83.4|Abnormal findings in cerebrospinal fluid, abnormal immunological findings
R83.5|Abnormal findings in cerebrospinal fluid, abnormal microbiological findings
R83.6|Abnormal findings in cerebrospinal fluid, abnormal cytological findings
R83.7|Abnormal findings in cerebrospinal fluid, abnormal histological findings
R83.8|Abnormal findings in cerebrospinal fluid, other abnormal findings
R83.9|Abnormal findings in cerebrospinal fluid, unspecified abnormal finding
R84|Abnormal findings in specimens from respiratory organs and thorax
R84.0|Abnormal findings in specimens from respiratory organs and thorax, abnormal level of enzymes
R84.1|Abnormal findings in specimens from respiratory organs and thorax, abnormal level of hormones
R84.2|Abnormal findings in specimens from respiratory organs and thorax,  abnormal level other drugs,  medicaments and biological substance
R84.3|Abnormal findings in specimens from respiratory organs and thorax, abnormal level substance chiefly nonmedicinal as to source
R84.4|Abnormal findings in specimens from respiratory organs and thorax, abnormal immunological findings
R84.5|Abnormal findings in specimens from respiratory organs and thorax,  abnormal microbiological findings
R84.6|Abnormal findings in specimens from respiratory organs and thorax, abnormal cytological findings
R84.7|Abnormal findings in specimens from respiratory organs and thorax, abnormal histological findings
R84.8|Abnormal findings in specimens from respiratory organs and thorax, other abnormal findings
R84.9|Abnormal findings in specimens from respiratory organs and thorax, unspecified abnormal finding
R85|Abnormal findings in specimens from digestive organs and abdominal cavity
R85.0|Abnormal finding in specimens from digestive organs and abnomoinal cavity, abnormal level of enzymes
R85.1|Abnormal finding in specimens from digestive organs and abnomoinal cavity, abnormal level of hormones
R85.2|Abnormal finding in specimens from digestive organs and abnomoinal cavity, abnormal level other drugs,  medicaments and biological substance
R85.3|Abnormal finding in specimens from digestive organs and abnomoinal cavity, abnormal level substance chiefly nonmedicinal as to source
R85.4|Abnormal finding in specimens from digestive organs and abnomoinal cavity, abnormal immunological findings
R85.5|Abnormal finding in specimens from digestive organs and abnomoinal cavity, abnormal microbiological findings
R85.6|Abnormal finding in specimens from digestive organs and abnomoinal cavity, abnormal cytological findings
R85.7|Abnormal finding in specimens from digestive organs and abnomoinal cavity, abnormal histological findings
R85.8|Abnormal finding in specimens from digestive organs and abnomoinal cavity,  other abnormal findings
R85.9|Abnormal finding in specimens from digestive organs and abnomoinal cavity, unspecified abnormal finding
R86|Abnormal findings in specimens from male genital organs
R86.0|Abnormal findings in specimens from male genital organs, abnormal level of enzymes
R86.1|Abnormal findings in specimens from male genital organs, abnormal level of hormones
R86.2|Abnormal findings in specimens from male genital organs, abnormal level other drugs,  medicaments and biological substance
R86.3|Abnormal findings in specimens from male genital organs, abnormal level substance chiefly nonmedicinal as to source
R86.4|Abnormal findings in specimens from male genital organs, abnormal immunological findings
R86.5|Abnormal findings in specimens from male genital organs,  abnormal microbiological findings
R86.6|Abnormal findings in specimens from male genital organs, abnormal cytological findings
R86.7|Abnormal findings in specimens from male genital organs, abnormal histological findings
R86.8|Abnormal findings in specimens from male genital organs, other abnormal findings
R86.9|Abnormal findings in specimens from male genital organs, unspecified abnormal finding
R87|Abnormal findings in specimens from female genital organs
R87.0|Abnormal findings in specimens from famale genital organs, abnormal level of enzymes
R87.1|Abnormal findings in specimens from famale genital organs, abnormal level of hormones
R87.2|Abnormal findings in specimens from famale genital organs, abnormal level other drugs,  medicaments and biological substance
R87.3|Abnormal findings in specimens from famale genital organs, abnormal level substance chiefly nonmedicinal as to source
R87.4|Abnormal findings in specimens from famale genital organs, abnormal immunological findings
R87.5|Abnormal findings in specimens from famale genital organs, abnormal microbiological findings
R87.6|Abnormal findings in specimens from famale genital organs, abnormal cytological findings
R87.7|Abnormal findings in specimens from famale genital organs, abnormal histological findings
R87.8|Abnormal findings in specimens from famale genital organs, other abnormal findings
R87.9|Abnormal findings in specimens from famale genital organs, unspecified abnormal finding
R89|Abnormal findings in specimens from other organs, systems and tissues
R89.0|Abnormal findings in specimens from other organs,systems and tissue,  abnormal level of enzymes
R89.1|Abnormal findings in specimens from other organs,systems and tissue,  abnormal level of hormones
R89.2|Abnormal findings in specimens from other organs,systems and tissue, abnormal level other drugs,  medicaments and biological substance
R89.3|Abnormal findings in specimens from other organs,systems and tissue, abnormal level substance chiefly nonmedicinal as to source
R89.4|Abnormal findings in specimens from other organs,systems and tissue, abnormal immunological findings
R89.5|Abnormal findings in specimens from other organs,systems and tissue,  abnormal microbiological findings
R89.6|Abnormal findings in specimens from other organs,systems and tissue, abnormal cytological findings
R89.7|Abnormal findings in specimens from other organs,systems and tissue, abnormal histological findings
R89.8|Abnormal findings in specimens from other organs,systems and tissue, other abnormal findings
R89.9|Abnormal findings in specimens from other organs,systems and tissue, unspecified abnormal finding
R90|Abnormal findings on diagnostic imaging of central nervous system
R90.0|Intracranial space-occupying lesion
R90.8|Other abnormal findings on diagnostic imaging of central nervous system
R91|Abnormal findings on diagnostic imaging of lung
R92|Abnormal findings on diagnostic imaging of breast
R93|Abnormal findings on diagnostic imaging of other body structures
R93.0|Abnormal findings on diagnostic imaging of skull and head NEC
R93.1|Abnormal findings on diagnostic imaging of heart and coronary circulation
R93.2|Abnormal findings diagnostic imaging of liver and biliary tract
R93.3|Abnormal findings diagnostic imaging of other parts of digestive tract
R93.4|Abnormal findings on diagnostic imaging of urinary organs
R93.5|Abnormal findings on diagnostic imaging of other abdominal regions, including retroperitoneum
R93.6|Abnormal findings on diagnostic imaging of limbs
R93.7|Abnormal findings on diagnostic imaging of other parts of musculoskeletal system
R93.8|Abnormal findings on diagnostic imaging of other specified body structures
R94|Abnormal results of function studies
R94.0|Abnormal results of function studies of central nervous system
R94.1|Abnormal results function studies peripheral nervous system special senses
R94.2|Abnormal results of pulmonary function studies
R94.3|Abnormal results of cardiovascular function studies
R94.4|Abnormal results of kidney function studies
R94.5|Abnormal results of liver function studies
R94.6|Abnormal results of thyroid function studies
R94.7|Abnormal results of other endocrine function studies
R94.8|Abnormal  results of function studies of other organs and systems
R95|Sudden infant death syndrome
R96|Other sudden death, cause unknown
R96.0|Instantaneous death
R96.1|Death occurring less than 24 hr from onset symptoms not otherwise explained
R98|Unattended death
R99|Other ill-defined and unspecified cause of mortality
S00|Superficial injury of head
S00.0|Superficial injury of scalp
S00.1|Contusion of eyelid and periocular area
S00.2|Other superficial injuries of eyelid and periocular area
S00.3|Superficial injury of nose
S00.4|Superficial injury of ear
S00.5|Superficial injury of lip and oral cavity
S00.7|Multiple superficial injuries of head
S00.8|Superficial injury of other parts of head
S00.9|Superficial injury of head, part unspecified
S01|Open wound of head
S01.0|Open wound of scalp
S01.1|Open wound of eyelid and periocular area
S01.2|Open wound of nose
S01.3|Open wound of ear
S01.4|Open wound of cheek and temporomandibular area
S01.5|Open wound of lip and oral cavity
S01.7|Multiple open wounds of head
S01.8|Open wound of other parts of head
S01.9|Open wound of head, part unspecified
S02|Fracture of skull and facial bones
S02.0|Fracture of vault of skull
S02.00|Fracture of vault of skull, closed
S02.01|Fracture of vault of skull, open
S02.1|Fracture of base of skull
S02.10|Fracture of base of skull, closed
S02.11|Fracture of base of skull, open
S02.2|Fracture of nasal bones
S02.20|Fracture of nasal bones, closed
S02.21|Fracture of nasal bones, open
S02.3|Fracture of orbital floor
S02.30|Fracture of orbital floor, closed
S02.31|Fracture of orbital floor, open
S02.4|Fracture of malar and maxillary bones
S02.40|Fracture of malar and maxillary bones, closed
S02.41|Fracture of malar and maxillary bones, open
S02.5|Fracture of tooth
S02.50|Fracture of tooth, closed
S02.51|Fracture of tooth, open
S02.6|Fracture of mandible
S02.60|Fracture of mandible, closed
S02.61|Fracture of mandible, open
S02.7|Multiple fractures involving skull and facial bones
S02.70|Multiple fractures involving skull and facial bones, closed
S02.71|Multiple fractures involving skull and facial bones, open
S02.8|Fractures of other skull and facial bones
S02.80|Fractures of other skull and facial bones, closed
S02.81|Fractures of other skull and facial bones, open
S02.9|Fracture of skull and facial bones, part unspecified
S02.90|Fracture of skull and facial bones, part unspecified, closed
S02.91|Fracture of skull and facial bones, part unspecified, open
S03|Dislocation, sprain and strain of joints and ligaments of head
S03.0|Dislocation of jaw
S03.1|Dislocation of septal cartilage of nose
S03.2|Dislocation of tooth
S03.3|Dislocation of other and unspecified parts of head
S03.4|Sprain and strain of jaw
S03.5|Sprain and strain joints ligs other and unspec parts head
S04|Injury of cranial nerves
S04.0|Injury of optic nerve and pathways
S04.1|Injury of oculomotor nerve
S04.2|Injury of trochlear nerve
S04.3|Injury of trigeminal nerve
S04.4|Injury of abducent nerve
S04.5|Injury of facial nerve
S04.6|Injury of acoustic nerve
S04.7|Injury of accessory nerve
S04.8|Injury of other cranial nerves
S04.9|Injury of unspecified cranial nerve
S05|Injury of eye and orbit
S05.0|Injury conjunctiva corneal abras without ment foreign body
S05.1|Contusion of eyeball and orbital tissues
S05.2|Ocular lacn and rupture with prolapse or loss intraoc tiss
S05.3|Ocular lacn without prolapse or loss of intraocular tissue
S05.4|Penetrating wound of orbit with or without foreign body
S05.5|Penetrating wound of eyeball with foreign body
S05.6|Penetrating wound of eyeball without foreign body
S05.7|Avulsion of eye
S05.8|Other injuries of eye and orbit
S05.9|Injury of eye and orbit, unspecified
S06|Intracranial injury
S06.0|Concussion
S06.00|Concussion, without open intracranial wound
S06.01|Concussion, with open  intracranial wound
S06.1|Traumatic cerebral oedema
S06.10|Traumatic cerebral oedema, without open intracranial wound
S06.11|Traumatic cerebral oedema, with open intracranial wound
S06.2|Diffuse brain injury
S06.20|Diffuse brain injury, without open intracranial wound
S06.21|Diffuse brain injury, with open intracranial wound
S06.3|Focal brain injury
S06.30|Focal brain injury, without open intracranial wound
S06.31|Focal brain injury, with open intracranial wound
S06.4|Epidural haemorrhage
S06.40|Epidural haemorrhage, without open intracranial wound
S06.41|Epidural haemorrhage, with open intracranial wound
S06.5|Traumatic subdural haemorrhage
S06.50|Traumatic subdural haemorrhage, without open intracranial wound
S06.51|Traumatic subdural haemorrhage, with open intracranial wound
S06.6|Traumatic subarachnoid haemorrhage
S06.60|Traumatic subarachnoid haemorrhage, without open intracranial wound
S06.61|Traumatic subarachnoid haemorrhage, with open intracranial wound
S06.7|Intracranial injury with prolonged coma
S06.70|Intracranial injury with prolonged coma, without open intracranial wound
S06.71|Intracranial injury with prolonged coma, with open intracranial wound
S06.8|Other intracranial injuries
S06.80|Other intracranial injuries, without open intracranial wound
S06.81|Other intracranial injuries, with open intracranial wound
S06.9|Intracranial injury, unspecified
S06.90|Intracranial injury, unspecified, without open intracranial wound
S06.91|Intracranial injury, unspecified, with open intracranial wound
S07|Crushing injury of head
S07.0|Crushing injury of face
S07.1|Crushing injury of skull
S07.8|Crushing injury of other parts of head
S07.9|Crushing injury of head, part unspecified
S08|Traumatic amputation of part of head
S08.0|Avulsion of scalp
S08.1|Traumatic amputation of ear
S08.8|Traumatic amputation of other parts of head
S08.9|Traumatic amputation of unspecified part of head
S09|Other and unspecified injuries of head
S09.0|Injury of blood vessels of head, not elsewhere classified
S09.1|Injury of muscle and tendon of head
S09.2|Traumatic rupture of ear drum
S09.7|Multiple injuries of head
S09.8|Other specified injuries of head
S09.9|Unspecified injury of head
S10|Superficial injury of neck
S10.0|Contusion of throat
S10.1|Other and unspecified superficial injuries of throat
S10.7|Multiple superficial injuries of neck
S10.8|Superficial injury of other parts of neck
S10.9|Superficial injury of neck, part unspecified
S11|Open wound of neck
S11.0|Open wound involving larynx and trachea
S11.1|Open wound involving thyroid gland
S11.2|Open wound involving pharynx and cervical oesophagus
S11.7|Multiple open wounds of neck
S11.8|Open wound of other parts of neck
S11.9|Open wound of neck, part unspecified
S12|Fracture of neck
S12.0|Fracture of first cervical vertebra
S12.00|Fracture of first cervical vertebra, closed
S12.01|Fracture of first cervical vertebra, open
S12.1|Fracture of second cervical vertebra
S12.10|Fracture of second cervical vertebra, closed
S12.11|Fracture of second cervical vertebra, open
S12.2|Fracture of other specified cervical vertebra
S12.20|Fracture of other specified cervical vertebra, closed
S12.21|Fracture of other specified cervical vertebra, open
S12.7|Multiple fractures of cervical spine
S12.70|Multiple fractures of cervical spine, closed
S12.71|Multiple fractures of cervical spine, open
S12.8|Fracture of other parts of neck
S12.80|Fracture of other parts of neck, closed
S12.81|Fracture of other parts of neck, open
S12.9|Fracture of neck, part unspecified
S12.90|Fracture of neck, part unspecified, closed
S12.91|Fracture of neck, part unspecified, open
S13|Dislocation, sprain and strain of joints and ligaments at neck level
S13.0|Traumatic rupture of cervical intervertebral disc
S13.1|Dislocation of cervical vertebra
S13.2|Dislocation of other and unspecified parts of neck
S13.3|Multiple dislocations of neck
S13.4|Sprain and strain of cervical spine
S13.5|Sprain and strain of thyroid region
S13.6|Sprain and strain of joints and ligaments of other and  unspecified parts of neck
S14|Injury of nerves and spinal cord at neck level
S14.0|Concussion and oedema of cervical spinal cord
S14.1|Other and unspecified injuries of cervical spinal cord
S14.2|Injury of nerve root of cervical spine
S14.3|Injury of brachial plexus
S14.4|Injury of peripheral nerves of neck
S14.5|Injury of cervical sympathetic nerves
S14.6|Injury of other and unspecified nerves of neck
S15|Injury of blood vessels at neck level
S15.0|Injury of carotid artery
S15.1|Injury of vertebral artery
S15.2|Injury of external jugular vein
S15.3|Injury of internal jugular vein
S15.7|Injury of multiple blood vessels at neck level
S15.8|Injury of other blood vessels at neck level
S15.9|Injury of unspecified blood vessel at neck level
S16|Injury of muscle and tendon at neck level
S17|Crushing injury of neck
S17.0|Crushing injury of larynx and trachea
S17.8|Crushing injury of other parts of neck
S17.9|Crushing injury of neck, part unspecified
S18|Traumatic amputation at neck level
S19|Other and unspecified injuries of neck
S19.7|Multiple injuries of neck
S19.8|Other specified injuries of neck
S19.9|Unspecified injury of neck
S20|Superficial injury of thorax
S20.0|Contusion of breast
S20.1|Other and unspecified superficial injuries of breast
S20.2|Contusion of thorax
S20.3|Other superficial injuries of front wall of thorax
S20.4|Other superficial injuries of back wall of thorax
S20.7|Multiple superficial injuries of thorax
S20.8|Superficial injury of other and unspecified parts of thorax
S21|Open wound of thorax
S21.0|Open wound of breast
S21.1|Open wound of front wall of thorax
S21.2|Open wound of back wall of thorax
S21.7|Multiple open wounds of thoracic wall
S21.8|Open wound of other parts of thorax
S21.9|Open wound of thorax, part unspecified
S22|Fracture of rib(s), sternum and thoracic spine
S22.0|Fracture of thoracic vertebra
S22.00|Fracture of thoracic vertebra, closed
S22.01|Fracture of thoracic vertebra, open
S22.1|Multiple fractures of thoracic spine
S22.10|Multiple fractures of thoracic spine, closed
S22.11|Multiple fractures of thoracic spine, open
S22.2|Fracture of sternum
S22.20|Fracture of sternum, closed
S22.21|Fracture of sternum, open
S22.3|Fracture of rib
S22.30|Fracture of rib, closed
S22.31|Fracture of rib, open
S22.4|Multiple fractures of ribs
S22.40|Multiple fractures of ribs, closed
S22.41|Multiple fractures of ribs, open
S22.5|Flail chest
S22.50|Flail chest, closed
S22.51|Flail chest, open
S22.8|Fracture of other parts of bony thorax
S22.80|Fracture of other parts of bony thorax, closed
S22.81|Fracture of other parts of bony thorax, open
S22.9|Fracture of bony thorax, part unspecified
S22.90|Fracture of bony thorax, part unspecified, closed
S22.91|Fracture of bony thorax, part unspecified, open
S23|Dislocation, sprain and strain of joints and ligaments of thorax
S23.0|Traumatic rupture of thoracic intervertebral disc
S23.1|Dislocation of thoracic vertebra
S23.2|Dislocation of other and unspecified parts of thorax
S23.3|Sprain and strain of thoracic spine
S23.4|Sprain and strain of ribs and sternum
S23.5|Sprain and strain of other and unspecified parts of thorax
S24|Injury of nerves and spinal cord at thorax level
S24.0|Concussion and oedema of thoracic spinal cord
S24.1|Other and unspecified injuries of thoracic spinal cord
S24.2|Injury of nerve root of thoracic spine
S24.3|Injury of peripheral nerves of thorax
S24.4|Injury of thoracic sympathetic nerves
S24.5|Injury of other nerves of thorax
S24.6|Injury of unspecified nerve of thorax
S25|Injury of blood vessels of thorax
S25.0|Injury of thoracic aorta
S25.1|Injury of innominate or subclavian artery
S25.2|Injury of superior vena cava
S25.3|Injury of innominate or subclavian vein
S25.4|Injury of pulmonary blood vessels
S25.5|Injury of intercostal blood vessels
S25.7|Injury of multiple blood vessels of thorax
S25.8|Injury of other blood vessels of thorax
S25.9|Injury of unspecified blood vessel of thorax
S26|Injury of heart
S26.0|Injury of heart with haemopericardium
S26.00|Injury of heart with haemopericardium, without open wound into thoracic cavity
S26.01|Injury of heart with haemopericardium, with open wound into thoracic cavity
S26.8|Other injuries of heart
S26.80|Other injuries of heart, without open wound into thoracic cavity
S26.81|Other injuries of heart, with open wound into thoracic cavity
S26.9|Injury of heart, unspecified
S26.90|Injury of heart, unspecified, withoutopen wound into thoracic cavity
S26.91|Injury of heart, unspecified, with open wound into thoracic cavity
S27|Injury of other and unspecified intrathoracic organs
S27.0|Traumatic pneumothorax
S27.00|Traumatic pneumothorax, without open wound into thoracic cavity
S27.01|Traumatic pneumothorax, with open wound into thoracic cavity
S27.1|Traumatic haemothorax
S27.10|Traumatic haemothorax, without open wound into thoracic cavity
S27.11|Traumatic haemothorax, with open wound into thoracic cavity
S27.2|Traumatic haemopneumothorax
S27.20|Traumatic haemopneumothorax, without open wound into thoracic cavity
S27.21|Traumatic haemopneumothorax, with open wound into thoracic cavity
S27.3|Other injuries of lung
S27.30|Other injuries of lung, without open wound into thoracic cavity
S27.31|Other injuries of lung, with open wound into thoracic cavity
S27.4|Injury of bronchus
S27.40|Injury of bronchus, without open wound into thoracic cavity
S27.41|Injury of bronchus, with open wound into thoracic cavity
S27.5|Injury of thoracic trachea
S27.50|Injury of thoracic trachea, without open wound into thoracic cavity
S27.51|Injury of thoracic trachea, with open wound into thoracic cavity
S27.6|Injury of pleura
S27.60|Injury of pleura, without open wound into thoracic cavity
S27.61|Injury of pleura, with open wound into thoracic cavity
S27.7|Multiple injuries of intrathoracic organs
S27.70|Multiple injuries of intrathoracic organs, without open wound into thoracic cavity
S27.71|Multiple injuries of intrathoracic organs, with open wound into thoracic cavity
S27.8|Injury of other specified intrathoracic organs
S27.80|Injury of other specified intrathoracic organs, without open wound into thoracic cavity
S27.81|Injury of other specified intrathoracic organs, with open wound into thoracic cavity
S27.9|Injury of unspecified intrathoracic organ
S27.90|Injury of unspecified intrathoracic organ, without open wound into thoracic cavity
S27.91|Injury of unspecified intrathoracic organ, with open wound into thoracic cavity
S28|Crushing injury of thorax and traumatic amputation of part of thorax
S28.0|Crushed chest
S28.1|Traumatic amputation of part of thorax
S29|Other and unspecified injuries of thorax
S29.0|Injury of muscle and tendon at thorax level
S29.7|Multiple injuries of thorax
S29.8|Other specified injuries of thorax
S29.9|Unspecified injury of thorax
S30|Superficial injury of abdomen, lower back and pelvis
S30.0|Contusion of lower back and pelvis
S30.1|Contusion of abdominal wall
S30.2|Contusion of external genital organs
S30.7|Multiple superficial injuries of abdomen lower back and pelvis
S30.8|Other superficial injuries of abdomen, lower back and pelvis
S30.9|Superficial injury of abdomen lower back and pelvis, part unspecified
S31|Open wound of abdomen, lower back and pelvis
S31.0|Open wound of lower back and pelvis
S31.1|Open wound of abdominal wall
S31.2|Open wound of penis
S31.3|Open wound of scrotum and testes
S31.4|Open wound of vagina and vulva
S31.5|Open wound of other and unspecified external genital organs
S31.7|Multiple open wounds of abdomen, lower back and pelvis
S31.8|Open wound of other and unspecified parts of abdomen
S32|Fracture of lumbar spine and pelvis
S32.0|Fracture of lumbar vertebra
S32.00|Fracture of lumbar vertebra, closed
S32.01|Fracture of lumbar vertebra, open
S32.1|Fracture of sacrum
S32.10|Fracture of sacrum, closed
S32.11|Fracture of sacrum, open
S32.2|Fracture of coccyx
S32.20|Fracture of coccyx, closed
S32.21|Fracture of coccyx, open
S32.3|Fracture of ilium
S32.30|Fracture of ilium, closed
S32.31|Fracture of ilium, open
S32.4|Fracture of acetabulum
S32.40|Fracture of acetabulum, closed
S32.41|Fracture of acetabulum, open
S32.5|Fracture of pubis
S32.50|Fracture of pubis, closed
S32.51|Fracture of pubis, open
S32.7|Multiple fractures of lumbar spine and pelvis
S32.70|Multiple fractures of lumbar spine and pelvis, closed
S32.71|Multiple fractures of lumbar spine and pelvis, open
S32.8|Fracture of oth unspecified parts of lumbar spine and pelvis
S32.80|Fracture of other and unspecified  parts of lumbar spine and pelvis, closed
S32.81|Fracture of other and unspecified parts of lumbar spine and pelvis, open
S33|Dislocation, sprain and strain of joints and ligaments of lumbar spine and pelvis
S33.0|Traumatic rupture of lumbar intervertebral disc
S33.1|Dislocation of lumbar vertebra
S33.2|Dislocation of sacroiliac and sacrococcygeal joint
S33.3|Dislocation oth and unspec parts of lumbar spine and pelvis
S33.4|Traumatic rupture of symphysis pubis
S33.5|Sprain and strain of lumbar spine
S33.6|Sprain and strain of sacroiliac joint
S33.7|Sprain and strain of other and unspec partsof lumbar spine pelvis
S34|Injury of nerves and lumbar spinal cord at abdomen, lower back and pelvis level
S34.0|Concussion and oedema of lumbar spinal cord
S34.1|Other injury of lumbar spinal cord
S34.2|Injury of nerve root of lumbar and sacral spine
S34.3|Injury of cauda equina
S34.4|Injury of lumbosacral plexus
S34.5|Injury of lumbar, sacral and pelvic sympathetic nerves
S34.6|Injury of peripheral nerve(s) of abdomen, lower back and pelvis
S34.8|Injury other and unspecified nerves abdomen lower back and pelvis level
S35|Injury of blood vessels at abdomen, lower back and pelvis level
S35.0|Injury of abdominal aorta
S35.1|Injury of inferior vena cava
S35.2|Injury of coeliac or mesenteric artery
S35.3|Injury of portal or splenic vein
S35.4|Injury of renal blood vessels
S35.5|Injury of iliac blood vessels
S35.7|Injury of multiple blood vessels at abdomen, lower back and pelvis level
S35.8|Injury of other blood vessels at abdomen, lower back and pelvis level
S35.9|Injury of unspecified blood vessel abdoment, lower back and pelvis level
S36|Injury of intra-abdominal organs
S36.0|Injury of spleen
S36.00|Injury of spleen, without open wound into cavity
S36.01|Injury of spleen, with open wound into cavity
S36.1|Injury of liver or gallbladder
S36.10|Injury of liver or gallbladder, without open wound into cavity
S36.11|Injury of liver or gallbladder, with open wound into cavity
S36.2|Injury of pancreas
S36.20|Injury of pancreas, without open wound into cavity
S36.21|Injury of pancreas, with open wound into cavity
S36.3|Injury of stomach
S36.30|Injury of stomach, without open wound into cavity
S36.31|Injury of stomach, with open wound into cavity
S36.4|Injury of small intestine
S36.40|Injury of small intestine, without open wound into cavity
S36.41|Injury of small intestine, with open wound into cavity
S36.5|Injury of colon
S36.50|Injury of colon, without open wound into cavity
S36.51|Injury of colon, with open wound into cavity
S36.6|Injury of rectum
S36.60|Injury of rectum, without open wound into cavity
S36.61|Injury of rectum, with open wound into cavity
S36.7|Injury of multiple intra-abdominal organs
S36.70|Injury of multiple intra-abdominal organs, without open wound into cavity
S36.71|Injury of multiple intra-abdominal organs, with open wound into cavity
S36.8|Injury of other intra-abdominal organs
S36.80|Injury of other intra-abdominal organs, without open wound into cavity
S36.81|Injury of other intra-abdominal organs, with open wound into cavity
S36.9|Injury of unspecified intra-abdominal organ
S36.90|Injury of unspecified intra-abdominal organ, without open wound into cavity
S36.91|Injury of unspecified intra-abdominal organ, with open wound into cavity
S37|Injury of urinary and pelvic organs
S37.0|Injury of kidney
S37.00|Injury of kidney, without open wound into cavity
S37.01|Injury of kidney, with open wound into cavity
S37.1|Injury of ureter
S37.10|Injury of ureter, without open wound into cavity
S37.11|Injury of ureter, with open wound into cavity
S37.2|Injury of bladder
S37.20|Injury of bladder, without open wound into cavity
S37.21|Injury of bladder, with open wound into cavity
S37.3|Injury of urethra
S37.30|Injury of urethra, without open wound into cavity
S37.31|Injury of urethra, with open wound into cavity
S37.4|Injury of ovary
S37.40|Injury of ovary, without open wound into cavity
S37.41|Injury of ovary, with open wound into cavity
S37.5|Injury of fallopian tube
S37.50|Injury of fallopian tube, without open wound into cavity
S37.51|Injury of fallopian tube, with open wound into cavity
S37.6|Injury of uterus
S37.60|Injury of uterus, without open wound into cavity
S37.61|Injury of uterus, with open wound into cavity
S37.7|Injury of multiple urinary and pelvic organs
S37.70|Injury of multiple urinary and pelvic organs, without open wound into cavity
S37.71|Injury of multiple urinary and pelvic organs, with open wound into cavity
S37.8|Injury of other urinary and pelvic organs
S37.80|Injury of other urinary and pelvic organs, without open wound into cavity
S37.81|Injury of other urinary and pelvic organs, with open wound into cavity
S37.9|Injury of unspecified urinary and pelvic organ
S37.90|Injury of unspecified urinary and pelvic organ, without open wound into cavity
S37.91|Injury of unspecified urinary and pelvic organ, with open wound into cavity
S38|Crushing injury and traumatic amputation of part of abdomen, lower back and pelvis
S38.0|Crushing injury of external genital organs
S38.1|Crushing injury of other and unspecified part of abdomen, lower back and pelvis
S38.2|Traumatic amputation of external genital organs
S38.3|Traumatic amputation of other and unspecified parts of abdomen, low back and pelvis
S39|Other and unspecified injuries of abdomen, lower back and pelvis
S39.0|Injury of muscle and tendon of abdomen lower back and pelvis
S39.6|Injury of intra-abdominal organ(s) with pelvic organ(s)
S39.7|Other multiple injuries of abdomen, lower back and pelvis
S39.8|Other specified injuries of abdomen, lower back and pelvis
S39.9|Unspecified injury of abdomen, lower back and pelvis
S40|Superficial injury of shoulder and upper arm
S40.0|Contusion of shoulder and upper arm
S40.7|Multiple superficial injuries of shoulder and upper arm
S40.8|Other superficial injuries of shoulder and upper arm
S40.9|Superficial injury of shoulder and upper arm, unspecified
S41|Open wound of shoulder and upper arm
S41.0|Open wound of shoulder
S41.1|Open wound of upper arm
S41.7|Multiple open wounds of shoulder and upper arm
S41.8|Open wound of other and unspecified parts of shoulder girdle
S42|Fracture of shoulder and upper arm
S42.0|Fracture of clavicle
S42.00|Fracture of clavicle, closed
S42.01|Fracture of clavicle, open
S42.1|Fracture of scapula
S42.10|Fracture of scapula, closed
S42.11|Fracture of scapula, open
S42.2|Fracture of upper end of humerus
S42.20|Fracture of upper end of humerus, closed
S42.21|Fracture of upper end of humerus, open
S42.3|Fracture of shaft of humerus
S42.30|Fracture of shaft of humerus, closed
S42.31|Fracture of shaft of humerus, open
S42.4|Fracture of lower end of humerus
S42.40|Fracture of lower end of humerus, closed
S42.41|Fracture of lower end of humerus, open
S42.7|Multiple fractures of clavicle, scapula and humerus
S42.70|Multiple fractures of clavicle, scapula and humerus, closed
S42.71|Multiple fractures of clavicle, scapula and humerus, open
S42.8|Fracture of other parts of shoulder and upper arm
S42.80|Fracture of other parts of shoulder and upper arm, closed
S42.81|Fracture of other parts of shoulder and upper arm, open
S42.9|Fracture of shoulder girdle, part unspecified
S42.90|Fracture of shoulder girdle, part unspecified, closed
S42.91|Fracture of shoulder girdle, part unspecified, open
S43|Dislocation, sprain and strain of joints and ligaments of shoulder girdle
S43.0|Dislocation of shoulder joint
S43.1|Dislocation of acromioclavicular joint
S43.2|Dislocation of sternoclavicular joint
S43.3|Dislocation of other and unspec parts of shoulder girdle
S43.4|Sprain and strain of shoulder joint
S43.5|Sprain and strain of acromioclavicular joint
S43.6|Sprain and strain of sternoclavicular joint
S43.7|Sprain and strain of oth and unspec part of shoulder girdle
S44|Injury of nerves at shoulder and upper arm level
S44.0|Injury of ulnar nerve at upper arm level
S44.1|Injury of median nerve at upper arm level
S44.2|Injury of radial nerve at upper arm level
S44.3|Injury of axillary nerve
S44.4|Injury of musculocutaneous nerve
S44.5|Injury of cutaneous sensory nerve at shoulder and upper arm level
S44.7|Injury of multiple nerves at shoulder and upper arm level
S44.8|Injury of other nerves at shoulder and upper arm level
S44.9|Injury of unspecified nerve at shoulder and upper arm level
S45|Injury of blood vessels at shoulder and upper arm level
S45.0|Injury of axillary artery
S45.1|Injury of brachial artery
S45.2|Injury of axillary or brachial vein
S45.3|Injury of superficial vein at shoulder and upper arm level
S45.7|Injury of multiple blood vessels shoulder and upper arm level
S45.8|Injury of oth blood vessels at shoulder and upper arm level
S45.9|Injury unspecified blood vessel at shoulder and upper arm level
S46|Injury of muscle and tendon at shoulder and upper arm level
S46.0|Injury of tendon of the rotator cuff of shoulder
S46.1|Injury of muscle and tendon of long head of biceps
S46.2|Injury of muscle and tendon of other parts of biceps
S46.3|Injury of muscle and tendon of triceps
S46.7|Injury multiple muscles and tendons shoulder and upper arm level
S46.8|Injury of other muscles and tendons at shoulder and upper arm level
S46.9|Injury unspecified muscle and tendon at shoulder and upper arm level
S47|Crushing injury of shoulder and upper arm
S48|Traumatic amputation of shoulder and upper arm
S48.0|Traumatic amputation at shoulder joint
S48.1|Traumatic amputation at level between shoulder and elbow
S48.9|Traumatic amputation of shoulder and upper arm level unspecified
S49|Other and unspecified injuries of shoulder and upper arm
S49.7|Multiple injuries of shoulder and upper arm
S49.8|Other specified injuries of shoulder and upper arm
S49.9|Unspecified injury of shoulder and upper arm
S50|Superficial injury of forearm
S50.0|Contusion of elbow
S50.1|Contusion of other and unspecified parts of forearm
S50.7|Multiple superficial injuries of forearm
S50.8|Other superficial injuries of forearm
S50.9|Superficial injury of forearm, unspecified
S51|Open wound of forearm
S51.0|Open wound of elbow
S51.7|Multiple open wounds of forearm
S51.8|Open wound of other parts of forearm
S51.9|Open wound of forearm, part unspecified
S52|Fracture of forearm
S52.0|Fracture of upper end of ulna
S52.00|Fracture of upper end of ulna, closed
S52.01|Fracture of upper end of ulna, open
S52.1|Fracture of upper end of radius
S52.10|Fracture of upper end of radius, closed
S52.11|Fracture of upper end of radius, open
S52.2|Fracture of shaft of ulna
S52.20|Fracture of shaft of ulna, closed
S52.21|Fracture of shaft of ulna, open
S52.3|Fracture of shaft of radius
S52.30|Fracture of shaft of radius, closed
S52.31|Fracture of shaft of radius, open
S52.4|Fracture of shafts of both ulna and radius
S52.40|Fracture of shafts of both ulna and radius, closed
S52.41|Fracture of shafts of both ulna and radius, open
S52.5|Fracture of lower end of radius
S52.50|Fracture of lower end of radius, closed
S52.51|Fracture of lower end of radius, open
S52.6|Fracture of lower end of both ulna and radius
S52.60|Fracture of lower end of both ulna and radius, closed
S52.61|Fracture of lower end of both ulna and radius, open
S52.7|Multiple fractures of forearm
S52.70|Multiple fractures of forearm , closed
S52.71|Multiple fractures of forearm , open
S52.8|Fracture of other parts of forearm
S52.80|Fracture of other parts of forearm , closed
S52.81|Fracture of other parts of forearm , open
S52.9|Fracture of forearm, part unspecified
S52.90|Fracture of forearm, part unspecified , closed
S52.91|Fracture of forearm, part unspecified , open
S53|Dislocation, sprain and strain of joints and ligaments of elbow
S53.0|Dislocation of radial head
S53.1|Dislocation of elbow, unspecified
S53.2|Traumatic rupture of radial collateral ligament
S53.3|Traumatic rupture of ulnar collateral ligament
S53.4|Sprain and strain of elbow
S54|Injury of nerves at forearm level
S54.0|Injury of ulnar nerve at forearm level
S54.1|Injury of median nerve at forearm level
S54.2|Injury of radial nerve at forearm level
S54.3|Injury of cutaneous sensory nerve at forearm level
S54.7|Injury of multiple nerves at forearm level
S54.8|Injury of other nerves at forearm level
S54.9|Injury of unspecified nerve at forearm level
S55|Injury of blood vessels at forearm level
S55.0|Injury of ulnar artery at forearm level
S55.1|Injury of radial artery at forearm level
S55.2|Injury of vein at forearm level
S55.7|Injury of multiple blood vessels at forearm level
S55.8|Injury of other blood vessels at forearm level
S55.9|Injury of unspecified blood vessel at forearm level
S56|Injury of muscle and tendon at forearm level
S56.0|Injury of flexor muscle and tendon of thumb at forearm level
S56.1|Injury long flexor muscle and tendon other finger(s) forearm level
S56.2|Injury of other flexor muscle and tendon at forearm level
S56.3|Injury extensor or abductor muscles and tendons of thumb at forearm level
S56.4|Injury extensor muscle and tendon oth finger(s) at forearm level
S56.5|Injury of other extensor muscle and tendon at forearm level
S56.7|Injury of multiple muscles and tendons at forearm level
S56.8|Injury other and unspecified muscles and tendons at forearm level
S57|Crushing injury of forearm
S57.0|Crushing injury of elbow
S57.8|Crushing injury of other parts of forearm
S57.9|Crushing injury of forearm, part unspecified
S58|Traumatic amputation of forearm
S58.0|Traumatic amputation at elbow level
S58.1|Traumatic amputation at level between elbow and wrist
S58.9|Traumatic amputation of forearm, level unspecified
S59|Other and unspecified injuries of forearm
S59.7|Multiple injuries of forearm
S59.8|Other specified injuries of forearm
S59.9|Unspecified injury of forearm
S60|Superficial injury of wrist and hand
S60.0|Contusion of finger(s) without damage to nail
S60.1|Contusion of finger(s) with damage to nail
S60.2|Contusion of other parts of wrist and hand
S60.7|Multiple superficial injuries of wrist and hand
S60.8|Other superficial injuries of wrist and hand
S60.9|Superficial injury of wrist and hand, unspecified
S61|Open wound of wrist and hand
S61.0|Open wound of finger(s) without damage to nail
S61.1|Open wound of finger(s) with damage to nail
S61.7|Multiple open wounds of wrist and hand
S61.8|Open wound of other parts of wrist and hand
S61.9|Open wound of wrist and hand part, part unspecified
S62|Fracture at wrist and hand level
S62.0|Fracture of navicular [scaphoid] bone of hand
S62.00|Fracture of navicular [scaphoid] bone of hand , closed
S62.01|Fracture of navicular [scaphoid] bone of hand , open
S62.1|Fracture of other carpal bone(s)
S62.10|Fracture of other carpal bone(s) , closed
S62.11|Fracture of other carpal bone(s) , open
S62.2|Fracture of first metacarpal bone
S62.20|Fracture of first metacarpal bone , closed
S62.21|Fracture of first metacarpal bone , open
S62.3|Fracture of other metacarpal bone
S62.30|Fracture of other metacarpal bone, closed
S62.31|Fracture of other metacarpal bone, open
S62.4|Multiple fractures of metacarpal bones
S62.40|Multiple fractures of metacarpal bones , closed
S62.41|Multiple fractures of metacarpal bones , open
S62.5|Fracture of thumb
S62.50|Fracture of thumb , closed
S62.51|Fracture of thumb , open
S62.6|Fracture of other finger
S62.60|Fracture of other finger , closed
S62.61|Fracture of other finger , open
S62.7|Multiple fractures of fingers
S62.70|Multiple fractures of fingers, closed
S62.71|Multiple fractures of fingers, open
S62.8|Fracture of other and unspecified parts of wrist and hand
S62.80|Fracture of other and unspecified parts of wrist and hand, closed
S62.81|Fracture of other and unspecified parts of wrist and hand, open
S63|Dislocation, sprain and strain of joints and ligaments at wrist and hand level
S63.0|Dislocation of wrist
S63.1|Dislocation of finger
S63.2|Multiple dislocations of fingers
S63.3|Traumatic rupture of ligament of wrist and carpus
S63.4|Traumatic rupture of ligament of finger at metacarpophalangeal and interphalangeal joint(s)
S63.5|Sprain and strain of wrist
S63.6|Sprain and strain of finger(s)
S63.7|Sprain and strain of other and unspecified parts of hand
S64|Injury of nerves at wrist and hand level
S64.0|Injury of ulnar nerve at wrist and hand level
S64.1|Injury of median nerve at wrist and hand level
S64.2|Injury of radial nerve at wrist and hand level
S64.3|Injury of digital nerve of thumb
S64.4|Injury of digital nerve of other finger
S64.7|Injury of multiple nerves at wrist and hand level
S64.8|Injury of other nerves at wrist and hand level
S64.9|Injury of unspecified nerve at wrist and hand level
S65|Injury of blood vessels at wrist and hand level
S65.0|Injury of ulnar artery at wrist and hand level
S65.1|Injury of radial artery at wrist and hand level
S65.2|Injury of superficial palmar arch
S65.3|Injury of deep palmar arch
S65.4|Injury of blood vessel(s) of thumb
S65.5|Injury of blood vessel(s) of other finger
S65.7|Injury of multiple blood vessels at wrist and hand level
S65.8|Injury of other blood vessels at wrist and hand level
S65.9|Injury of unspecified blood vessel at wrist and hand level
S66|Injury of muscle and tendon at wrist and hand level
S66.0|Injury of long flexor muscle and tendon of thumb at wrist and hand level
S66.1|Injury of flexor muscle and tendon of other finger at wrist and hand level
S66.2|Injury of extensor muscle and tendon of thumb at wrist and hand level
S66.3|Injury of extensor muscle and tendon of other finger at wrist and hand level
S66.4|Injury of intrinsic muscle and tendon of thumb at wrist and hand level
S66.5|Injury of intrinsic muscle and tendon other finger at wrist and hand level
S66.6|Injury of multiple flexor muscles and tendons at wrist and hand level
S66.7|Injury of multiple extensor muscles and tendons at wrist and hand level
S66.8|Injury of other muscles and tendons at wrist and hand level
S66.9|Injury unspecified muscle and tendon at wrist and hand level
S67|Crushing injury of wrist and hand
S67.0|Crushing injury of thumb and other finger(s)
S67.8|Crush injury other and unspecified parts of wrist and hand
S68|Traumatic amputation of wrist and hand
S68.0|Traumatic amputation of thumb (complete)(partial)
S68.1|Traumatic amputation of other single finger (complete)(partial)
S68.2|Traumatic amputation two or more fingers alone (cmpte/part)
S68.3|Combination traumatic amputation of (part of) finger(s) with other parts wrist and hand
S68.4|Traumatic amputation of hand at wrist level
S68.8|Traumatic amputation of other parts of wrist and hand
S68.9|Traumatic amputation of wrist and hand, level unspecified
S69|Other and unspecified injuries of wrist and hand
S69.7|Multiple injuries of wrist and hand
S69.8|Other specified injuries of wrist and hand
S69.9|Unspecified injury of wrist and hand
S70|Superficial injury of hip and thigh
S70.0|Contusion of hip
S70.1|Contusion of thigh
S70.7|Multiple superficial injuries of hip and thigh
S70.8|Other superficial injuries of hip and thigh
S70.9|Superficial injury of hip and thigh, unspecified
S71|Open wound of hip and thigh
S71.0|Open wound of hip
S71.1|Open wound of thigh
S71.7|Multiple open wounds of hip and thigh
S71.8|Open wound of other and unspecified parts of pelvic girdle
S72|Fracture of femur
S72.0|Fracture of neck of femur
S72.00|Fracture of neck of femur, closed
S72.01|Fracture of neck of femur, open
S72.1|Pertrochanteric fracture
S72.10|Pertrochanteric fracture, closed
S72.11|Pertrochanteric fracture, open
S72.2|Subtrochanteric fracture
S72.20|Subtrochanteric fracture, closed
S72.21|Subtrochanteric fracture, open
S72.3|Fracture of shaft of femur
S72.30|Fracture of shaft of femur, closed
S72.31|Fracture of shaft of femur, open
S72.4|Fracture of lower end of femur
S72.40|Fracture of lower end of femur, closed
S72.41|Fracture of lower end of femur, open
S72.7|Multiple fractures of femur
S72.70|Multiple fractures of femur, closed
S72.71|Multiple fractures of femur, open
S72.8|Fractures of other parts of femur
S72.80|Fractures of other parts of femur, closed
S72.81|Fractures of other parts of femur, open
S72.9|Fracture of femur, part unspecified
S72.90|Fracture of femur, part unspecified, closed
S72.91|Fracture of femur, part unspecified , open
S73|Dislocation, sprain and strain of joint and ligaments of hip
S73.0|Dislocation of hip
S73.1|Sprain and strain of hip
S74|Injury of nerves at hip and thigh level
S74.0|Injury of sciatic nerve at hip and thigh level
S74.1|Injury of femoral nerve at hip and thigh level
S74.2|Injury of cutaneous sensory nerve at hip and thigh level
S74.7|Injury of multiple nerves at hip and thigh level
S74.8|Injury of other nerves at hip and thigh level
S74.9|Injury of unspecified nerve at hip and thigh level
S75|Injury of blood vessels at hip and thigh level
S75.0|Injury of femoral artery
S75.1|Injury of femoral vein at hip and thigh level
S75.2|Injury of greater saphenous vein at hip and thigh level
S75.7|Injury of multiple blood vessels at hip and thigh level
S75.8|Injury of other blood vessels at hip and thigh level
S75.9|Injury of unspecified blood vessel at hip and thigh level
S76|Injury of muscle and tendon at hip and thigh level
S76.0|Injury of muscle and tendon of hip
S76.1|Injury of quadriceps muscle and tendon
S76.2|Injury of adductor muscle and tendon of thigh
S76.3|Injury of muscle and tendon of the posterior muscle group at thigh level
S76.4|Injury of other and unspec muscles and tendons at thigh level
S76.7|Injury of multiple muscles and tendons at hip & thigh level
S77|Crushing injury of hip and thigh
S77.0|Crushing injury of hip
S77.1|Crushing injury of thigh
S77.2|Crushing injury of hip with thigh
S78|Traumatic amputation of hip and thigh
S78.0|Traumatic amputation at hip joint
S78.1|Traumatic amputation at level between hip and knee
S78.9|Traumatic amputation of hip and thigh, level unspecified
S79|Other and specified injuries of hip and thigh
S79.7|Multiple injuries of hip and thigh
S79.8|Other specified injuries of hip and thigh
S79.9|Unspecified injury of hip and thigh
S80|Superficial injury of lower leg
S80.0|Contusion of knee
S80.1|Contusion of other and unspecified parts of lower leg
S80.7|Multiple superficial injuries of lower leg
S80.8|Other superficial injuries of lower leg
S80.9|Superficial injury of lower leg, unspecified
S81|Open wound of lower leg
S81.0|Open wound of knee
S81.7|Multiple open wounds of lower leg
S81.8|Open wound of other parts of lower leg
S81.9|Open wound of lower leg, part unspecified
S82|Fracture of lower leg, including ankle
S82.0|Fracture of patella
S82.00|Fracture of patella, closed
S82.01|Fracture of patella, open
S82.1|Fracture of upper end of tibia
S82.10|Fracture of upper end of tibia, closed
S82.11|Fracture of upper end of tibia , open
S82.2|Fracture of shaft of tibia
S82.20|Fracture of shaft of tibia, closed
S82.21|Fracture of shaft of tibia , open
S82.3|Fracture of lower end of tibia
S82.30|Fracture of lower end of tibia, closed
S82.31|Fracture of lower end of tibia , open
S82.4|Fracture of fibula alone
S82.40|Fracture of fibula alone, closed
S82.41|Fracture of fibula alone , open
S82.5|Fracture of medial malleolus
S82.50|Fracture of medial malleolus, closed
S82.51|Fracture of medial malleolus , open
S82.6|Fracture of lateral malleolus
S82.60|Fracture of lateral malleolus, closed
S82.61|Fracture of lateral malleolus, open
S82.7|Multiple fractures of lower leg
S82.70|Multiple fractures of lower leg, closed
S82.71|Multiple fractures of lower leg, open
S82.8|Fractures of other parts of lower leg
S82.80|Fractures of other parts of lower leg, closed
S82.81|Fractures of other parts of lower leg, open
S82.9|Fracture of lower leg, part unspecified
S82.90|Fracture of lower leg, part unspecified, closed
S82.91|Fracture of lower leg, part unspecified , open
S83|Dislocation, sprain and strain of joints and ligaments of knee
S83.0|Dislocation of patella
S83.1|Dislocation of knee
S83.2|Tear of meniscus, current
S83.3|Tear of articular cartilage of knee, current
S83.4|Sprain and strain involving (fibular)(tibial) collateral lig knee
S83.5|Sprain and strain involving (anterior)(posterior) cruciate lig knee
S83.6|Sprain and strain of other and unspecified parts of knee
S83.7|Injury to multiple structures of knee
S84|Injury of nerves at lower leg level
S84.0|Injury of tibial nerve at lower leg level
S84.1|Injury of peroneal nerve at lower leg level
S84.2|Injury of cutaneous sensory nerve at lower leg level
S84.7|Injury of multiple nerves at lower leg level
S84.8|Injury of other nerves at lower leg level
S84.9|Injury of unspecified nerve at lower leg level
S85|Injury of blood vessels at lower leg level
S85.0|Injury of popliteal artery
S85.1|Injury of (anterior)(posterior) tibial artery
S85.2|Injury of peroneal artery
S85.3|Injury of greater saphenous vein at lower leg level
S85.4|Injury of lesser saphenous vein at lower leg level
S85.5|Injury of popliteal vein
S85.7|Injury of multiple blood vessels at lower leg level
S85.8|Injury of other blood vessels at lower leg level
S85.9|Injury of unspecified blood vessel at lower leg level
S86|Injury of muscle and tendon at lower leg level
S86.0|Injury of achilles tendon
S86.1|Injury other muscle(s) tendon(s) of posterior muscle group at low leg level
S86.2|Injury of muscle(s) and tendon(s) of anterior muscle group at lower leg level
S86.3|Injury of muscle(s) and tendon(s) peroneal muscle group at lower leg level
S86.7|Injury of multiple muscles and tendons at lower leg level
S86.8|Injury of other muscles and tendons at lower leg level
S86.9|Injury of unspecified muscle and tendon at lower leg level
S87|Crushing injury of lower leg
S87.0|Crushing injury of knee
S87.8|Crushing injury of other and unspecified parts of lower leg
S88|Traumatic amputation of lower leg
S88.0|Traumatic amputation at knee level
S88.1|Traumatic amputation at level between knee and ankle
S88.9|Traumatic amputation of lower leg, level unspecified
S89|Other and unspecified injuries of lower leg
S89.7|Multiple injuries of lower leg
S89.8|Other specified injuries of lower leg
S89.9|Unspecified injury of lower leg
S90|Superficial injury of ankle and foot
S90.0|Contusion of ankle
S90.1|Contusion of toe(s) without damage to nail
S90.2|Contusion of toe(s) with damage to nail
S90.3|Contusion of other and unspecified parts of foot
S90.7|Multiple superficial injuries of ankle and foot
S90.8|Other superficial injuries of ankle and foot
S90.9|Superficial injury of ankle and foot, unspecified
S91|Open wound of ankle and foot
S91.0|Open wound of ankle
S91.1|Open wound of toe(s) without damage to nail
S91.2|Open wound of toe(s) with damage to nail
S91.3|Open wound of other parts of foot
S91.7|Multiple open wounds of ankle and foot
S92|Fracture of foot, except ankle
S92.0|Fracture of calcaneus
S92.00|Fracture of calcaneus, closed
S92.01|Fracture of calcaneus , open
S92.1|Fracture of talus
S92.10|Fracture of talus, closed
S92.11|Fracture of talus, open
S92.2|Fracture of other tarsal bone(s)
S92.20|Fracture of other tarsal bone(s) , closed
S92.21|Fracture of other tarsal bone(s) , open
S92.3|Fracture of metatarsal bone
S92.30|Fracture of metatarsal bone, closed
S92.31|Fracture of metatarsal bone , open
S92.4|Fracture of great toe
S92.40|Fracture of great toe, closed
S92.41|Fracture of great toe, open
S92.5|Fracture of other toe
S92.50|Fracture of other toe, closed
S92.51|Fracture of other toe, open
S92.7|Multiple fractures of foot
S92.70|Multiple fractures of foot, closed
S92.71|Multiple fractures of foot , open
S92.9|Fracture of foot, unspecified
S92.90|Fracture of foot, unspecified, closed
S92.91|Fracture of foot, unspecified , open
S93|Dislocation, sprain and strain of joints and ligaments at ankle and foot level
S93.0|Dislocation of ankle joint
S93.1|Dislocation of toe(s)
S93.2|Rupture of ligaments at ankle and foot level
S93.3|Dislocation of other and unspecified parts of foot
S93.4|Sprain and strain of ankle
S93.5|Sprain and strain of toe(s)
S93.6|Sprain and strain of other and unspecified parts of foot
S94|Injury of nerves at ankle and foot level
S94.0|Injury of lateral plantar nerve
S94.1|Injury of medial plantar nerve
S94.2|Injury of deep peroneal nerve at ankle and foot level
S94.3|Injury of cutaneous sensory nerve at ankle and foot level
S94.7|Injury of multiple nerves at ankle and foot level
S94.8|Injury of other nerves at ankle and foot level
S94.9|Injury of unspecified nerve at ankle and foot level
S95|Injury of blood vessels at ankle and foot level
S95.0|Injury of dorsal artery of foot
S95.1|Injury of plantar artery of foot
S95.2|Injury of dorsal vein of foot
S95.7|Injury of multiple blood vessels at ankle and foot level
S95.8|Injury of other blood vessels at ankle and foot level
S95.9|Injury of unspecified blood vessel at ankle and foot level
S96|Injury of muscle and tendon at ankle and foot level
S96.0|Injury muscle and tendon of long flexor muscle toe at ankle and foot level
S96.1|Injury muscle & tendon long extensor muscle toe at ankle and foot level
S96.2|Injury of intrinsic muscle and tendon at ankle and foot level
S96.7|Injury of multi muscles and tendons at ankle and foot level
S96.8|Injury of other muscles and tendons at ankle and foot level
S96.9|Injury of unspec muscle and tendon at ankle and foot level
S97|Crushing injury of ankle and foot
S97.0|Crushing injury of ankle
S97.1|Crushing injury of toe(s)
S97.8|Crushing injury of other parts of ankle and foot
S98|Traumatic amputation of ankle and foot
S98.0|Traumatic amputation of foot at ankle level
S98.1|Traumatic amputation of one toe
S98.2|Traumatic amputation of two or more toes
S98.3|Traumatic amputation of other parts of foot
S98.4|Traumatic amputation of foot, level unspecified
S99|Other and unspecified injuries of ankle and foot
S99.7|Multiple injuries of ankle and foot
S99.8|Other specified injuries of ankle and foot
S99.9|Unspecified injury of ankle and foot
T00|Superficial injuries involving multiple body regions
T00.0|Superficial injuries involving head with neck
T00.1|Superficial injuries involving thorax with abdomen, lower back and pelvis
T00.2|Superficial injuries involving multiple region of upper limb(s)
T00.3|Superficial injuries involving multiple region of lower limb(s)
T00.6|Superficial injuries involving multiple region upper limb(s) with lower limb(s)
T00.8|Superfic injuries involving oth combinations of body regions
T00.9|Multiple superficial injuries, unspecified
T01|Open wounds involving multiple body regions
T01.0|Open wounds involving head with neck
T01.1|Open wounds involving thorax wth abdomen, lower back and pelvis
T01.2|Open wounds involving multiple regions of upper limb(s)
T01.3|Open wounds involving multiple regions of lower limb(s)
T01.6|Open wounds involving multiple regions of up limb(s) with low limb(s)
T01.8|Open wounds involving other combinations of body regions
T01.9|Multiple open wounds, unspecified
T02|Fractures involving multiple body regions
T02.0|Fractures involving head with neck
T02.00|Fractures involving head with neck, closed
T02.01|Fractures involving head with neck, open
T02.1|Fractures involving thorax with lower back and pelvis
T02.10|Fractures involving thorax with lower back and pelvis, closed
T02.11|Fractures involving thorax with lower back and pelvis, open
T02.2|Fractures involving multiple regions of one upper limb
T02.20|Fractures involving multiple regions of one upper limb, closed
T02.21|Fractures involving multiple regions of one upper limb, open
T02.3|Fractures involving multiple regions of one lower limb
T02.30|Fractures involving multiple regions of one lower limb, closed
T02.31|Fractures involving multiple regions of one lower limb, open
T02.4|Fractures involving multiple regions of both upper limbs
T02.40|Fractures involving multiple regions of both upper limbs, closed
T02.41|Fractures involving multiple regions of both upper limbs, open
T02.5|Fractures involving multiple regions of both lower limbs
T02.50|Fractures involving multiple regions of both lower limbs, closed
T02.51|Fractures involving multiple regions of both lower limbs, open
T02.6|Fractures involving multiple regions of up limb(s) with low limb(s)
T02.60|Fractures involving multiple regions of up limb(s) with low limb(s), closed
T02.61|Fractures involving multiple regions of up limb(s) with low limb(s), open
T02.7|Fractures involving thorax with lower back and pelvis with limb(s)
T02.70|Fractures involving thorax with lower back and pelvis with limb(s), closed
T02.71|Fractures involving thorax with lower back and pelvis with limb(s), open
T02.8|Fractures involving other combinations of body regions
T02.80|Fractures involving other combinations of body regions, closed
T02.81|Fractures involving other combinations of body regions, open
T02.9|Multiple fractures, unspecified
T02.90|Multiple fractures, unspecified, closed
T02.91|Multiple fractures, unspecified, open
T03|Dislocations, sprains and strains involving multiple body regions
T03.0|Dislocations, sprains and strains involving head with neck
T03.1|Dislocation sprains and strains involving thorax wth lower back and pelvis
T03.2|Dislocation sprains and strains involving multiple regions upper limb(s)
T03.3|Dislocation sprains and strains involving multiple reginns lower limb(s)
T03.4|Dislocation sprains and strains involving multiple regions  upper & lower limb(s)
T03.8|Dislocation sprains and strains involving other combinations body regions
T03.9|Multiple dislocations, sprains and strains, unspecified
T04|Crushing injuries involving multiple body regions
T04.0|Crushing injuries involving head with neck
T04.1|Crush injuries involving thorax with abdomen lower back and pelvis
T04.2|Crushing injuries involving multiple region of upper limb(s)
T04.3|Crushing injuries involving multiple region of lower limb(s)
T04.4|Crushing injuries involving multiple regions of upper limb(s) with lower limb(s)
T04.7|Crushing injuries of thorax with abdomen, lower back and pelvis with limb(s)
T04.8|Crushing injuries involving other combinations of body regions
T04.9|Multiple crushing injuries, unspecified
T05|Traumatic amputations involving multiple body regions
T05.0|Traumatic amputation of both hands
T05.1|Traumatic amputation of one hand and other arm [any level, except hand]
T05.2|Traumatic amputation of both arms [any level]
T05.3|Traumatic amputation of both feet
T05.4|Traumatic amputation of one foot and other leg [any level except foot]
T05.5|Traumatic amputation of both legs [any level]
T05.6|Traumatic amputation of upper and lower limbs, any combination [any level]
T05.8|Traumatic amputations involving other combinations of body regions
T05.9|Multiple traumatic amputations, unspecified
T06|Other injuries involving multiple body regions, not elsewhere classified
T06.0|Injuries of  brain and cranial nerve with injuries of nerves and spinal cord neck level
T06.1|Injuries of nerves and spinal cord involving other multiple body regions
T06.2|Injuries of nerves involving multiple body regions
T06.3|Injuries of blood vessels involving multiple body regions
T06.4|Injuries of muscles and tendons involving multiple body regions
T06.5|Injuries of  intrathoracic organ with intra-abdominal and pelvic organs
T06.8|Other specified injuries involving multiple body regions
T07|Unspecified multiple injuries
T08|Fracture of spine, level unspecified
T08.0|Fracture of spine, level unspecified , closed
T08.1|Fracture of spine, level unspecified , open
T09|Other injuries of spine and trunk, level unspecified
T09.0|Superficial injury of trunk, level unspecified
T09.1|Open wound of trunk, level unspecified
T09.2|Dislocation sprain and strain unspec joint and ligament trunk
T09.3|Injury of spinal cord, level unspecified
T09.4|Injury unspecified nerve, spinal nerve root and plexus of trunk
T09.5|Injury of unspecified muscle and tendon of trunk
T09.6|Traumatic amputation of trunk, level unspecified
T09.8|Other specified injuries of trunk, level unspecified
T09.9|Unspecified injury of trunk, level unspecified
T10|Fracture of upper limb, level unspecified
T10.0|Fracture of upper limb, level unspecified , closed
T10.1|Fracture of upper limb, level unspecified , open
T11|Other injuries of upper limb, level unspecified
T11.0|Superficial injury of upper limb, level unspecified
T11.1|Open wound of upper limb, level unspecified
T11.2|Disl'n sprain/strain unsp joint & ligament upr limb lvl unsp
T11.3|Injury of unspecified nerve of upper limb, level unspecified
T11.4|Injury of unspec blood vessel of upper limb level unspec act
T11.5|Injury of unspec muscle & tendon of upr limb level unspec act
T11.6|Traumatic amputation of upper limb, level unspecified
T11.8|Other specified injuries of upper limb, level unspecified
T11.9|Unspecified injury of upper limb, level unspecified
T12|Fracture of lower limb, level unspecified
T12.0|Fracture of lower limb, level unspecified, closed
T12.1|Fracture of lower limb, level unspecified, open
T13|Other injuries of lower limb, level unspecified
T13.0|Superficial injury of lower limb, level unspecified
T13.1|Open wound of lower limb, level unspecified
T13.2|Dislocation sprain and strain unspecified joint and ligament of lower limb, level unspecified
T13.3|Injury of unspecified nerve of lower limb, level unspecified
T13.4|Injury of unspecified blood vessel of lower limb level unspecified
T13.5|Injury of unspecified muscle & tendon of lower limb, level unspecified
T13.6|Traumatic amputation of lower limb, level unspecified
T13.8|Other specified injuries of lower limb, level unspecified
T13.9|Unspecified injury of lower limb, level unspecified
T14|Injury of unspecified body region
T14.0|Superficial injury of unspecified body region
T14.1|Open wound of unspecified body region
T14.2|Fracture of unspecified body region
T14.20|Fracture of unspecified body region, closed
T14.21|Fracture of unspecified body region, open
T14.3|Dislocation, sprain and strain of unspecified body region
T14.30|Dislocation, sprain and strain of unspecified body region, closed
T14.31|Dislocation, sprain and strain of unspecified body region, open
T14.4|Injury of nerve(s) of unspecified body region
T14.40|Injury of nerve(s) of unspecified body region, closed
T14.41|Injury of nerve(s) of unspecified body region, open
T14.5|Injury of blood vessel(s) of unspecified body region
T14.50|Injury of blood vessel(s) of unspecified body region, closed
T14.51|Injury of blood vessel(s) of unspecified body region, open
T14.6|Injury of muscles and tendons of unspecified body region
T14.60|Injury of muscles and tendons of unspecified body region, closed
T14.61|Injury of muscles and tendons of unspecified body region, open
T14.7|Crush injury and traumatic amputation of unspec body region
T14.70|Crush injury and traumatic amputation of unspec body region, closed
T14.71|Crush injury and traumatic amputation of unspec body region, open
T14.8|Other injuries of unspecified body region
T14.80|Other injuries of unspecified body region, closed
T14.81|Other injuries of unspecified body region, open
T14.9|Injury, unspecified
T14.90|Injury, unspecified, closed
T14.91|Injury, unspecified, open
T15|Foreign body on external eye
T15.0|Foreign body in cornea
T15.1|Foreign body in conjunctival sac
T15.8|Foreign body in other and multiple parts of external eye
T15.9|Foreign body on external eye, part unspecified
T16|Foreign body in ear
T17|Foreign body in respiratory tract
T17.0|Foreign body in nasal sinus
T17.1|Foreign body in nostril
T17.2|Foreign body in pharynx
T17.3|Foreign body in larynx
T17.4|Foreign body in trachea
T17.5|Foreign body in bronchus
T17.8|Foreign body in other and multiple parts of respiratory tract
T17.9|Foreign body in respiratory tract, part unspecified
T18|Foreign body in alimentary tract
T18.0|Foreign body in mouth
T18.1|Foreign body in oesophagus
T18.2|Foreign body in stomach
T18.3|Foreign body in small intestine
T18.4|Foreign body in colon
T18.5|Foreign body in anus and rectum
T18.8|Foreign body in other and multiple parts of alimentary tract
T18.9|Foreign body in alimentary tract, part unspecified
T19|Foreign body in genitourinary tract
T19.0|Foreign body in urethra
T19.1|Foreign body in bladder
T19.2|Foreign body in vulva and vagina
T19.3|Foreign body in uterus [any part]
T19.8|Foreign body in oth and multiple part of genitourinary tract
T19.9|Foreign body in genitourinary tract, part unspecified
T20|Burn and corrosion of head and neck
T20.0|Burn of unspecified degree of head and neck
T20.1|Burn of first degree of head and neck
T20.2|Burn of second degree of head and neck
T20.3|Burn of third degree of head and neck
T20.4|Corrosion of unspecified degree of head and neck
T20.5|Corrosion of first degree of head and neck
T20.6|Corrosion of second degree of head and neck
T20.7|Corrosion of third degree of head and neck
T21|Burn and corrosion of trunk
T21.0|Burn of unspecified degree of trunk
T21.1|Burn of first degree of trunk
T21.2|Burn of second degree of trunk
T21.3|Burn of third degree of trunk
T21.4|Corrosion of unspecified degree of trunk
T21.5|Corrosion of first degree of trunk
T21.6|Corrosion of second degree of trunk
T21.7|Corrosion of third degree of trunk
T22|Burn and corrosion of shoulder and upper limb, except wrist and hand
T22.0|Burn  of unspecified degree of shoulder and upper limb except wrist and hand
T22.1|Burn of first degree of shoulder and upper limb, except wrist and hand
T22.2|Burn of secondary degree of shoulder and upper limb, except wrist and hand
T22.3|Burn of third degree of shoulder and upper limb excpt wrist and hand
T22.4|Corrosion unspecified degree of shoulder and upper limb except wrist and hand
T22.5|Corrosion of first degree of shoulder and upper limb, except wrist and hand
T22.6|Corrosion secondary degree shoulder and upper limb except wrist and hand
T22.7|Corrosion of third degree shoulder and upper limb, except wrist and hand
T23|Burn and corrosion of wrist and hand
T23.0|Burn of unspecified degree of wrist and hand
T23.1|Burn of first degree of wrist and hand
T23.2|Burn of second degree of wrist and hand
T23.3|Burn of third degree of wrist and hand
T23.4|Corrosion of unspecified degree of wrist and hand
T23.5|Corrosion of first degree of wrist and hand
T23.6|Corrosion of second degree of wrist and hand
T23.7|Corrosion of third degree of wrist and hand
T24|Burn and corrosion of hip and lower limb, except ankle and foot
T24.0|Burn of unspecified degree of hip and lower limb except ankle and foot
T24.1|Burn of first degree hip and lower limb except ankle and foot
T24.2|Burn of second degree hip and lower limb except ankle and foot
T24.3|Burn of third degree hip and lower limb except ankle and foot
T24.4|Corrosion of unspecified degree hip and lower limb except ankle & foot
T24.5|Corrosion of first degree hip and lower limb, except ankle & foot
T24.6|Corrosion of second degree hip and lower limb, except ankle and foot
T24.7|Corrosion of third degree of hip and lower limb, except ankle and foot
T25|Burn and corrosion of ankle and foot
T25.0|Burn of unspecified degree of ankle and foot
T25.1|Burn of first degree of ankle and foot
T25.2|Burn of second degree of ankle and foot
T25.3|Burn of third degree of ankle and foot
T25.4|Corrosion of unspecified degree of ankle and foot
T25.5|Corrosion of first degree of ankle and foot
T25.6|Corrosion of second degree of ankle and foot
T25.7|Corrosion of third degree of ankle and foot
T26|Burn and corrosion confined to eye and adnexa
T26.0|Burn of eyelid and periocular area
T26.1|Burn of cornea and conjunctival sac
T26.2|Burn with resulting rupture and destruction of eyeball
T26.3|Burn of other parts of eye and adnexa
T26.4|Burn of eye and adnexa, part unspecified
T26.5|Corrosion of eyelid and periocular area
T26.6|Corrosion of cornea and conjunctival sac
T26.7|Corrosion with resulting rupture and destruction of eyeball
T26.8|Corrosion of other parts of eye and adnexa
T26.9|Corrosion of eye and adnexa, part unspecified
T27|Burn and corrosion of respiratory tract
T27.0|Burn of larynx and trachea
T27.1|Burn involving larynx and trachea with lung
T27.2|Burn of other parts of respiratory tract
T27.3|Burn of respiratory tract, part unspecified
T27.4|Corrosion of larynx and trachea
T27.5|Corrosion involving larynx and trachea with lung
T27.6|Corrosion of other parts of respiratory tract
T27.7|Corrosion of respiratory tract, part unspecified
T28|Burn and corrosion of other internal organs
T28.0|Burn of mouth and pharynx
T28.1|Burn of oesophagus
T28.2|Burn of other parts of alimentary tract
T28.3|Burn of internal genitourinary organs
T28.4|Burn of other and unspecified internal organs
T28.5|Corrosion of mouth and pharynx
T28.6|Corrosion of oesophagus
T28.7|Corrosion of other parts of alimentary tract
T28.8|Corrosion of internal genitourinary organs
T28.9|Corrosion of other and unspecified internal organs
T29|Burns and corrosions of multiple body regions
T29.0|Burns of multiple regions, unspecified degree
T29.1|Burns multi regions no more than first-degree burns mentioned
T29.2|Burns multi regions no more than second-degree burns mentioned
T29.3|Burns multi regions at least one burn of third degree mentioned
T29.4|Corrosions of multiple regions, unspecified degree
T29.5|Corrosions of  multiple regions, no more than first-deg corrosions mentioned
T29.6|Corrosions of  multiple regions, no more than second-degree corrosions mentioned
T29.7|Corros multi reg at least one corros of third deg mentioned
T30|Burn and corrosion, body region unspecified
T30.0|Burn of unspecified body region, unspecified degree
T30.1|Burn of first degree, body region unspecified
T30.2|Burn of second degree, body region unspecified
T30.3|Burn of third degree, body region unspecified
T30.4|Corrosion of unspecified body region, unspecified degree
T30.5|Corrosion of first degree, body region unspecified
T30.6|Corrosion of second degree, body region unspecified
T30.7|Corrosion of third degree, body region unspecified
T31|Burns classified according to extent of body surface involved
T31.0|Burns involving less than 10% of body surface
T31.1|Burns involving 10-19% of body surface
T31.2|Burns involving 20-29% of body surface
T31.3|Burns involving 30-39% of body surface
T31.4|Burns involving 40-49% of body surface
T31.5|Burns involving 50-59% of body surface
T31.6|Burns involving 60-69% of body surface
T31.7|Burns involving 70-79% of body surface
T31.8|Burns involving 80-89% of body surface
T31.9|Burns involving 90% or more of body surface
T32|Corrosions classified according to extent of body surface involved
T32.0|Corrosions involving less than 10% of body surface
T32.1|Corrosions involving 10-19% of body surface
T32.2|Corrosions involving 20-29% of body surface
T32.3|Corrosions involving 30-39% of body surface
T32.4|Corrosions involving 40-49% of body surface
T32.5|Corrosions involving 50-59% of body surface
T32.6|Corrosions involving 60-69% of body surface
T32.7|Corrosions involving 70-79% of body surface
T32.8|Corrosions involving 80-89% of body surface
T32.9|Corrosions involving 90% or more of body surface
T33|Superficial frostbite
T33.0|Superficial frostbite of head
T33.1|Superficial frostbite of neck
T33.2|Superficial frostbite of thorax
T33.3|Superficial frostbite of abdominal wall,  lower back and pelvis
T33.4|Superficial frostbite of arm
T33.5|Superficial frostbite of wrist and hand
T33.6|Superficial frostbite of hip and thigh
T33.7|Superficial frostbite of knee and lower leg
T33.8|Superficial frostbite of ankle and foot
T33.9|Superficial frostbite of other and unspecified sites
T34|Frostbite with tissue necrosis
T34.0|Frostbite with tissue necrosis of head
T34.1|Frostbite with tissue necrosis of neck
T34.2|Frostbite with tissue necrosis of thorax
T34.3|Frostbite with tissue necrosis abdominal wall, lower back and pelvis
T34.4|Frostbite with tissue necrosis of arm
T34.5|Frostbite with tissue necrosis of wrist and hand
T34.6|Frostbite with tissue necrosis of hip and thigh
T34.7|Frostbite with tissue necrosis of knee and lower leg
T34.8|Frostbite with tissue necrosis of ankle and foot
T34.9|Frostbite with tissue necrosis of other and unspec sites
T35|Frostbite involving multiple body regions and unspecified frostbite
T35.0|Superficial frostbite involving multiple body regions
T35.1|Frostbite with tissue necrosis involving multiple body regions
T35.2|Unspecified frostbite of head and neck
T35.3|Unspecified frostbite thorax, abdomen, lowerr back and pelvis
T35.4|Unspecified frostbite of upper limb
T35.5|Unspecified frostbite of lower limb
T35.6|Unspecified frostbite involving multiple body regions
T35.7|Unspecified frostbite of unspecified site
T36|Poisoning by systemic antibiotics
T36.0|Poisoning, penicillins
T36.1|Poisoning, cefalosporins and other beta-lactam antibiotics
T36.2|Poisoning, chloramphenicol group
T36.3|Poisoning, macrolides
T36.4|Poisoning, tetracyclines
T36.5|Poisoning, aminoglycosides
T36.6|Poisoning, rifamycins
T36.7|Poisoning, antifungal antibiotics, systemically used
T36.8|Poisoning, other systemic antibiotics
T36.9|Poisoning, systemic antibiotic, unspecified
T37|Poisoning by other systemic anti-infectives and antiparasitics
T37.0|Poisoning, sulfonamides
T37.1|Poisoning, antimycobacterial drugs
T37.2|Poisoning, antimalarials and drugs acting on other blood protozoa
T37.3|Poisoning, other antiprotozoal drugs
T37.4|Poisoning, anthelminthics
T37.5|Poisoning, antiviral drugs
T37.8|Poisoning, other specified systemic anti-infectives and antiparasitics
T37.9|Poisoning, systemic anti-infective and antiparasitic, unspecified
T38|Poisoning by hormones and their synthetic substitutes and antagonists, not elsewhere classified
T38.0|Poisoning, glucocorticoids and synthetic analogues
T38.1|Poisoning, thyroid hormones and substitutes
T38.2|Poisoning, antithyroid drugs
T38.3|Poisoning, insulin and oral hypoglycaemic [antidiabetic] drugs
T38.4|Poisoning, oral contraceptives
T38.5|Poisoning, other estrogens and progestogens
T38.6|Poisoning, antigonadotropins, antiestrogens, antiandrogens nec
T38.7|Poisoning, androgens and anabolic congeners
T38.8|Poisoning, other and unspecified hormones and their synthetic substitutes
T38.9|Poisoning, other and unspecified hormone antagonists
T39|Poisoning by nonopioid analgesics, antipyretics and antirheumatics
T39.0|Poisoning, salicylates
T39.1|Poisoning, 4-aminophenol derivatives
T39.2|Poisoning, pyrazolone derivatives
T39.3|Poisoning, other nonsteroidal anti-inflammatory drugs [NSAID]
T39.4|Poisoning, antirheumatics, not elsewhere classified
T39.8|Poisoning, other nonopiod analgesics and antipyretics nec
T39.9|Poisoning, nonopioid analgesic, antipyretic and antirheumatic unspec act
T40|Poisoning by narcotics and psychodysleptics [hallucinogens]
T40.0|Poisoning, opium
T40.1|Poisoning, heroin
T40.2|Poisoning, other opioids
T40.3|Poisoning, methadone
T40.4|Poisoning, other synthetic narcotics
T40.5|Poisoning, cocaine
T40.6|Poisoning, other and unspecified narcotics
T40.7|Poisoning, cannabis (derivatives)
T40.8|Poisoning, lysergide [lsd]
T40.9|Poisoning, other and unspecified psychodysleptics [hallucinogens]
T41|Poisoning by anaesthetics and therapeutic gases
T41.0|Poisoning, inhaled anaesthetics
T41.1|Poisoning, intravenous anaesthetics
T41.2|Poisoning, other and unspecified general anaesthetics
T41.3|Poisoning, local anaesthetics
T41.4|Poisoning, anaesthetic, unspecified
T41.5|Poisoning, therapeutic gases
T42|Poisoning by antiepileptic, sedative-hypnotic and antiparkinsonism drugs
T42.0|Poisoning, hydantoin derivatives
T42.1|Poisoning, iminostilbenes
T42.2|Poisoning, succinimides and oxazolidinediones
T42.3|Poisoning, barbiturates
T42.4|Poisoning, benzodiazepines
T42.5|Poisoning, mixed antiepileptics, not elsewhere classified
T42.6|Poisoning, other antiepileptic and sedative-hypnotic drugs
T42.7|Poisoning, antiepileptic and sedative-hypnotic drugs, unspecified
T42.8|Poisoning, antiparkinson drug and other central muscle-tone depressant
T43|Poisoning by psychotropic drugs, not elsewhere classified
T43.0|Poisoning, tricyclic and tetracyclic antidepressants
T43.1|Poisoning, monoamine-oxidase-inhibitor antidepressants
T43.2|Poisoning, other and unspecified antidepressants
T43.3|Poisoning, phenothiazine antipsychotics and neuroleptics
T43.4|Poisoning, butyrophenone and thioxanthene neuroleptics
T43.5|Poisoning, other and unspecified antipsychotics and neuroleptics
T43.6|Poisoning, psychostimulants with abuse potential
T43.8|Poisoning, other psychotropic drugs, not elsewhere classified
T43.9|Poisoning, psychotropic drug, unspecified
T44|Poisoning by drugs primarily affecting the autonomic nervous system
T44.0|Poisoning, anticholinesterase agents
T44.1|Poisoning, other parasympathomimetics [cholinergics]
T44.2|Poisoning, ganglionic blocking drugs, not elsewhere classified
T44.3|Poisoning, oth parasympatholy [antichol and antimusc] spasmolytics nec
T44.4|Poisoning, predominantly alpha-adrenoreceptor agonists nec
T44.5|Poisoning, predominantly beta-adrenreceptor agonists nec
T44.6|Poisoning, alpha-adrenoreceptor agonists nec
T44.7|Poisoning, beta-adrenreceptor agonists nec
T44.8|Poisoning, centrally acting and adrenergic-neuron-blocking agents nec
T44.9|Poisoning, other unspecified drugs primarily affect the autonomic nervous system
T45|Poisoning by primarily systemic and haematological agents, not elsewhere classified
T45.0|Poisoning, antiallergic and antiemetic drugs
T45.1|Poisoning, antineoplastic and immunosuppressive drugs
T45.2|Poisoning, vitamins, not elsewhere classified
T45.3|Poisoning, enzymes, not elsewhere classified
T45.4|Poisoning, iron and its compounds
T45.5|Poisoning, anticoagulants
T45.6|Poisoning, fibrinolysis-affecting drugs
T45.7|Poisoning, anticoagulant antagonists, vitamin k and other coagulants
T45.8|Poisoning, other primarily systemic and haematological agents
T45.9|Poisoning, primarily systemic and haematological agent, unspecified
T46|Poisoning by agents primarily affecting the cardiovascular system
T46.0|Poisoning, cardiac-stimulant glycosides and drugs of similar action
T46.1|Poisoning, calcium-channel blockers
T46.2|Poisoning, other antidysrhythmic drugs, not elsewhere classified
T46.3|Poisoning, coronary vasodilators, not elsewhere classified
T46.4|Poisoning, angiotensin-converting-enzyme inhibitors
T46.5|Poisoning, other antihypertensive drugs, not elsewhere classified
T46.6|Poisoning, antihyperlipidaemic and antiarteriosclerotic drugs
T46.7|Poisoning, peripheral vasodilators
T46.8|Poisoning, antivaricose drugs, including sclerosing agents
T46.9|Poisoning, oth and unspec agent primarily affect the cardiovascular sys
T47|Poisoning by agents primarily affecting the gastrointestinal system
T47.0|Poisoning, histamine h2-receptor antagonists
T47.1|Poisoning, other antacids and anti-gastric-secretion drugs
T47.2|Poisoning, stimulant laxatives
T47.3|Poisoning, saline and osmotic laxatives
T47.4|Poisoning, other laxatives
T47.5|Poisoning, digestants
T47.6|Poisoning, antidiarrhoeal drugs
T47.7|Poisoning, emetics
T47.8|Poisoning, other agents primarily affecting the gastrointestinal system
T47.9|Poisoning, agent primarily affecting the gastrointestinal syst unspec act
T48|Poisoning by agents primarily acting on smooth and skeletal muscles and the respiratory system
T48.0|Poisoning, oxytocic drugs
T48.1|Poisoning, skeletal muscle relaxants [neuromuscular blocking agents]
T48.2|Poisoning, other and unspecified agents primarily acting on muscles
T48.3|Poisoning, antitussives
T48.4|Poisoning, expectorants
T48.5|Poisoning, anti-common-cold drugs
T48.6|Poisoning, antiasthmatics, not elsewhere classified
T48.7|Poisoning, other and unspec agents primarily acting on the respiratory system
T49|Poisoning by topical agents primarily affecting skin and mucous membrane and by ophthalmological, otorhinolaryngological and dental drugs
T49.0|Poisoning, loc antifungal anti-infective & anti-inflammatory drug nec
T49.1|Poisoning, antipruritics
T49.2|Poisoning, local astringents and local detergents
T49.3|Poisoning, emollients, demulcents and protectants
T49.4|Poisoning, keratolytics keratoplastics oth hair treat drugs and preps
T49.5|Poisoning, ophthalmological drugs and preparations
T49.6|Poisoning, otorhinolaryngological drugs and preparations
T49.7|Poisoning, dental drugs, topically applied
T49.8|Poisoning, other topical agents
T49.9|Poisoning, topical agent, unspecified
T50|Poisoning by diuretics and other and unspecified drugs, medicaments and biological substances
T50.0|Poisoning, mineralocorticoids and their antagonists
T50.1|Poisoning, loop [high-ceiling] diuretics
T50.2|Poisoning, carbonic-anhydrase inhibitors benzothiadiazide oth diuretic
T50.3|Poisoning, electrolytic, caloric and water-balance agents
T50.4|Poisoning, drugs affecting uric acid metabolism
T50.5|Poisoning, appetite depressants
T50.6|Poisoning, antidotes and chelating agents, not elsewhere classified
T50.7|Poisoning, analeptics and opioid receptor antagonists
T50.8|Poisoning, diagnostic agents
T50.9|Poisoning, other and unspec drugs medicaments & biological subs
T51|Toxic effect of alcohol
T51.0|Toxic effect, ethanol
T51.1|Toxic effect, methanol
T51.2|Toxic effect, 2-propanol
T51.3|Toxic effect, fusel oil
T51.8|Toxic effect, other alcohols
T51.9|Toxic effect, alcohol, unspecified
T52|Toxic effect of organic solvents
T52.0|Toxic effect, petroleum products
T52.1|Toxic effect, benzene
T52.2|Toxic effect, homologues of benzene
T52.3|Toxic effect, glycols
T52.4|Toxic effect, ketones
T52.8|Toxic effect, other organic solvents
T52.9|Toxic effect, organic solvent, unspecified
T53|Toxic effect of halogen derivatives of aliphatic and aromatic hydrocarbons
T53.0|Toxic effect, carbon tetrachloride
T53.1|Toxic effect, chloroform
T53.2|Toxic effect, trichloroethylene
T53.3|Toxic effect, tetrachloroethylene
T53.4|Toxic effect, dichloromethane
T53.5|Toxic effect, chlorofluorocarbons
T53.6|Toxic effect, other halogen derivatives of aliphatic hydrocarbons
T53.7|Toxic effect, other halogen derivatives of aromatic hydrocarbons
T53.9|Toxic effect, halogen derivative of aliphatic and aromatic hydrocarbons
T54|Toxic effect of corrosive substances
T54.0|Toxic effect, phenol and phenol homologues
T54.1|Toxic effect, other corrosive organic compounds
T54.2|Toxic effect, corrosive acids and acid-like substances
T54.3|Toxic effect, corrosive alkalis and alkali-like substances
T54.9|Toxic effect, corrosive substance, unspecified
T55|Toxic effect of soaps and detergents
T56|Toxic effect of metals
T56.0|Toxic effect, lead and its compounds
T56.1|Toxic effect, mercury and its compounds
T56.2|Toxic effect, chromium and its compounds
T56.3|Toxic effect, cadmium and its compounds
T56.4|Toxic effect, copper and its compounds
T56.5|Toxic effect, zinc and its compounds
T56.6|Toxic effect, tin and its compounds
T56.7|Toxic effect, beryllium and its compounds
T56.8|Toxic effect, other metals
T56.9|Toxic effect, metal, unspecified
T57|Toxic effect of other inorganic substances
T57.0|Toxic effect, arsenic and its compounds
T57.1|Toxic effect, phosphorus and its compounds
T57.2|Toxic effect, manganese and its compounds
T57.3|Toxic effect, hydrogen cyanide
T57.8|Toxic effect, other specified inorganic substances
T57.9|Toxic effect, inorganic substance, unspecified
T58|Toxic effect of carbon monoxide
T59|Toxic effect of other gases, fumes and vapours
T59.0|Toxic effect, nitrogen oxides
T59.1|Toxic effect, sulfur dioxide
T59.2|Toxic effect, formaldehyde
T59.3|Toxic effect, lacrimogenic gas
T59.4|Toxic effect, chlorine gas
T59.5|Toxic effect, fluorine gas and hydrogen fluoride
T59.6|Toxic effect, hydrogen sulfide
T59.7|Toxic effect, carbon dioxide
T59.8|Toxic effect, other specified gases, fumes and vapours
T59.9|Toxic effect, gases, fumes and vapours, unspecified
T60|Toxic effect of pesticides
T60.0|Toxic effect, organophosphate and carbamate insecticides
T60.1|Toxic effect, halogenated insecticides
T60.2|Toxic effect, other insecticides
T60.3|Toxic effect, herbicides and fungicides
T60.4|Toxic effect, rodenticides
T60.8|Toxic effect, other pesticides
T60.9|Toxic effect, pesticide, unspecified
T61|Toxic effect of noxious substances eaten as seafood
T61.0|Toxic effect, ciguatera fish poisoning
T61.1|Toxic effect, scombroid fish poisoning
T61.2|Toxic effect, other fish and shellfish poisoning
T61.8|Toxic effect of other seafoods
T61.9|Toxic effect of unspecified seafood
T62|Toxic effect of other noxious substances eaten as food
T62.0|Toxic effect, ingested mushrooms
T62.1|Toxic effect, ingested berries
T62.2|Toxic effect, other ingested (parts of) plant(s)
T62.8|Toxic effect, other specified noxious substances eaten as food
T62.9|Toxic effect, noxious substance eaten as food, unspecified
T63|Toxic effect of contact with venomous animals
T63.0|Toxic effect, snake venom
T63.1|Toxic effect, venom of other reptiles
T63.2|Toxic effect, venom of scorpion
T63.3|Toxic effect, venom of spider
T63.4|Toxic effect, venom of other arthropods
T63.5|Toxic effect of contact with fish
T63.6|Toxic effect of contact with other marine animals
T63.8|Toxic effect of contact with other venomous animals
T63.9|Toxic effect of contact with unspecified venomous animal
T64|Toxic effect of aflatoxin and other mycotoxin food contams
T65|Toxic effect of other and unspecified substances
T65.0|Toxic effect, cyanides
T65.1|Toxic effect, strychnine and its salts
T65.2|Toxic effect, tobacco and nicotine
T65.3|Toxic effect, nitroderivs and aminoderivs of benzene and its homologues
T65.4|Toxic effect, carbon disulfide
T65.5|Toxic effect, nitroglycerin and other nitric acids and esters
T65.6|Toxic effect, paints and dyes, not elsewhere classified
T65.8|Toxic effect of other specified substances
T65.9|Toxic effect of unspecified substance
T66|Unspecified effects of radiation
T67|Effects of heat and light
T67.0|Heatstroke and sunstroke
T67.1|Heat syncope
T67.2|Heat cramp
T67.3|Heat exhaustion, anhydrotic
T67.4|Heat exhaustion due to salt depletion
T67.5|Heat exhaustion, unspecified
T67.6|Heat fatigue, transient
T67.7|Heat oedema
T67.8|Other effects of heat and light
T67.9|Effect of heat and light, unspecified
T68|Hypothermia
T69|Other effects of reduced temperature
T69.0|Immersion hand and foot
T69.1|Chilblains
T69.8|Other specified effects of reduced temperature
T69.9|Effect of reduced temperature, unspecified
T70|Effects of air pressure and water pressure
T70.0|Otitic barotrauma
T70.1|Sinus barotrauma
T70.2|Other and unspecified effects of high altitude
T70.3|Caisson disease [decompression sickness]
T70.4|Effects of high-pressure fluids
T70.8|Other effects of air pressure and water pressure
T70.9|Effect of air pressure and water pressure, unspecified
T71|Asphyxiation
T73|Effects of other deprivation
T73.0|Effects of hunger
T73.1|Effects of thirst
T73.2|Exhaustion due to exposure
T73.3|Exhaustion due to excessive exertion
T73.8|Other effects of deprivation
T73.9|Effect of deprivation, unspecified
T74|Maltreatment syndromes
T74.0|Neglect or abandonment
T74.1|Physical abuse
T74.2|Sexual abuse
T74.3|Psychological abuse
T74.8|Other maltreatment syndromes
T74.9|Maltreatment syndrome, unspecified
T75|Effects of other external causes
T75.0|Effects of lightning
T75.1|Drowning and nonfatal submersion
T75.2|Effects of vibration
T75.3|Motion sickness
T75.4|Effects of electric current
T75.8|Other specified effects of external causes
T78|Adverse effects, not elsewhere classified
T78.0|Anaphylactic shock due to adverse food reaction
T78.1|Other adverse food reactions, not elsewhere classified
T78.2|Anaphylactic shock, unspecified
T78.3|Angioneurotic oedema
T78.4|Allergy, unspecified
T78.8|Other adverse effects, not elsewhere classified
T78.9|Adverse effect, unspecified
T79|Certain early complications of trauma, not elsewhere classified
T79.0|Air embolism (traumatic)
T79.1|Fat embolism (traumatic)
T79.2|Traumatic secondary and recurrent haemorrhage
T79.3|Post-traumatic wound infection, not elsewhere classified
T79.4|Traumatic shock
T79.5|Traumatic anuria
T79.6|Traumatic ischaemia of muscle
T79.7|Traumatic subcutaneous emphysema
T79.8|Other early complications of trauma
T79.9|Unspecified early complication of trauma
T80|Complications following infusion, transfusion and therapeutic injection
T80.0|Air embolism following infusion transfusion and therapeutic inject
T80.1|Vasc comps following infusion transfusion and therapeutic inject
T80.2|Infections following infusion transfusion and therapeutic inject
T80.3|ABO incompatibility reaction
T80.4|Rh incompatibility reaction
T80.5|Anaphylactic shock due to serum
T80.6|Other serum reactions
T80.8|Other complications following infusion transfusion & therap inject
T80.9|Unspecified complication following infusion transfusion and therapeutic inject
T81|Complications of procedures, not elsewhere classified
T81.0|Haemorrhage and haematoma complicating a procedure nec
T81.1|Shock during or resulting from a procedure nec
T81.2|Accidental puncture and laceration during a procedure nec
T81.3|Disruption of operation wound, not elsewhere classified
T81.4|Infection following a procedure, not elsewhere classified
T81.5|Foreign body accidentally left in body cavity or operation wound following a procedure
T81.6|Acute reaction to foreign substance accident left during a procedures
T81.7|Vascular complications following a procedure
T81.8|Other complications of procedures, not elsewhere classified
T81.9|Unspecified complication of procedure
T82|Complications of cardiac and vascular prosthetic devices, implants and grafts
T82.0|Mechanical complication of heart valve prosthesis
T82.1|Mechanical complication of cardiac electronic device
T82.2|Mech complication of coronary artery bypass and valve grafts
T82.3|Mechanical complication of other vascular grafts
T82.4|Mechanical complication of vascular dialysis catheter
T82.5|Mechanical complication of other cardiac and vascular devices and implants
T82.6|Infection and inflammatory reaction due to cardiac valve prosthesis
T82.7|Infection and inflammatory reaction due other cardiac and vascular devices, implant and grafts
T82.8|Other complications of cardic and vascular prosthetic devices, implants and grafts
T82.9|Unspecified complications of cardiac and vascular prosthetic devices, implants and grafts
T83|Complications of genitourinary prosthetic devices, implants and grafts
T83.0|Mechanical complication of urinary (indwelling) catheter
T83.1|Mechanical complication of other urinary devices and implants
T83.2|Mechanical complication of graft of urinary organ
T83.3|Mechanical complication of intrauterine contraceptive device
T83.4|Mechanical complication of other prosthetic devices, implants and grafts in genital tract
T83.5|Infection and  inflammatory reaction due to prosthetic devices, implant and graft urinary system
T83.6|Infection inflammatory reaction due to prosthetic device, implant and  graft in genital tract
T83.8|Others complications of genitourinary prosthetic device, implants and grafts
T83.9|Unspecified complication of genitourinary prosthetic devices, implant and graft
T84|Complications of internal orthopaedic prosthetic devices, implants and grafts
T84.0|Mechanical complication of internal joint prosthesis
T84.1|Mechanical complication of internal fixation device of bones of limb
T84.2|Mechanical complication of internal fixation device of other bones
T84.3|Mechanical complication other bone devices implants and grafts
T84.4|Mechanical complication of other internal orthopaedic devices, implants and grafts
T84.5|Infection and inflammatory reaction due to internal joint pros
T84.6|Infection and inflammatory reaction due internal fixation device [any site]
T84.7|Infection and inflammatory reaction due to other internal orthopedic prosthetic devices, implants and  grafts
T84.8|Other complications of internal orthopaedic prosthtic devices, implants & grafts
T84.9|Unspecified complication of internal othopaedic prosthetic device, implant & graft
T85|Complications of other internal prosthetic devices, implants and grafts
T85.0|Mechanical complication of ventricular intracranial (communicating) shunt
T85.1|Mechanical complication implanted electronic stimulator of nervous system
T85.2|Mechanical complication of intraocular lens
T85.3|Mechanical complication of other ocular prosthetic devices, implants and grafts
T85.4|Mechanical complication of breast prosthesis and implant
T85.5|Mechanical complication of gastrointestinal prosthetic devices, implants and grafts
T85.6|Mechanical complication of other specified internal prosthetic devices, implants and grafts
T85.7|Infection inflammatory reaction due to other internal prosthetic devices, implants and grafts
T85.8|Other complications of internal prosthetic devices, implants and  grafts nec
T85.9|Unspecified complication of internal prosthetic device, implant and graft
T86|Failure and rejection of transplanted organs and tissues
T86.0|Bone-marrow transplant rejection
T86.1|Kidney transplant failure and rejection
T86.2|Heart transplant failure and rejection
T86.3|Heart-lung transplant failure and rejection
T86.4|Liver transplant failure and rejection
T86.8|Failure and reject of other transplanted organs and tissues
T86.9|Failure and reject of unspecified transplanted organ and tissue
T87|Complications peculiar to reattachment and amputation
T87.0|Complications of reattached (part of) upper extremity
T87.1|Complications of reattached (part of) lower extremity
T87.2|Complications of other reattached body part
T87.3|Neuroma of amputation stump
T87.4|Infection of amputation stump
T87.5|Necrosis of amputation stump
T87.6|Other and unspecified complications of amputation stump
T88|Other complications of surgical and medical care, not elsewhere classified
T88.0|Infection following immunization
T88.1|Other complications following immunization nec
T88.2|Shock due to anaesthesia
T88.3|Malignant hyperthermia due to anaesthesia
T88.4|Failed or difficult intubation
T88.5|Other complications of anaesthesia
T88.6|Anaphylactic shock due adverse effect of correct drug or medicament properly administered
T88.7|Unspecified adverse effect of drug or medicament
T88.8|Other specified complications of surgical and medical care nec
T88.9|Complication of surgical and medical care, unspecified
T90|Sequelae of injuries of head
T90.0|Sequelae of superficial injury of head
T90.1|Sequelae of open wound of head
T90.2|Sequelae of fracture of skull and facial bones
T90.3|Sequelae of injury of cranial nerves
T90.4|Sequelae of injury of eye and orbit
T90.5|Sequelae of intracranial injury
T90.8|Sequelae of other specified injuries of head
T90.9|Sequelae of unspecified injury of head
T91|Sequelae of injuries of neck and trunk
T91.0|Sequelae of superficial injury and open wound of neck and trunk
T91.1|Sequelae of fracture of spine
T91.2|Sequelae of other fracture of thorax and pelvis
T91.3|Sequelae of injury of spinal cord
T91.4|Sequelae of injury of intrathoracic organs
T91.5|Sequelae of injury of intra-abdominal and pelvic organs
T91.8|Sequelae of other specified injuries of neck and trunk
T91.9|Sequelae of unspecified injury of neck and trunk
T92|Sequelae of injuries of upper limb
T92.0|Sequelae of open wound of upper limb
T92.1|Sequelae of fracture of arm
T92.2|Sequelae of fracture at wrist and hand level
T92.3|Sequelae of dislocation, sprain and strain of upper limb
T92.4|Sequelae of injury of nerve of upper limb
T92.5|Sequelae of injury of muscle and tendon of upper limb
T92.6|Sequelae of crushing injury and traumatic amputation of upper limb
T92.8|Sequelae of other specified injuries of upper limb
T92.9|Sequelae of unspecified injury of upper limb
T93|Sequelae of injuries of lower limb
T93.0|Sequelae of open wound of lower limb
T93.1|Sequelae of fracture of femur
T93.2|Sequelae of other fractures of lower limb
T93.3|Sequelae of dislocation, sprain and strain of lower limb
T93.4|Sequelae of injury of nerve of lower limb
T93.5|Sequelae of injury of muscle and tendon of lower limb
T93.6|Sequelae of crush injury and traumatic amputation of lower limb
T93.8|Sequelae of other specified injuries of lower limb
T93.9|Sequelae of unspecified injury of lower limb
T94|Sequelae of injuries involving multiple and unspecified body regions
T94.0|Sequelae of injuries involving multiple body regions
T94.1|Sequelae of injuries, not specified by body region
T95|Sequelae of burns, corrosions and frostbite
T95.0|Sequelae of burn, corrosion and frostbite of head and neck
T95.1|Sequelae of burn, corrosion and frostbite of trunk
T95.2|Sequelae of burn, corrosion and frostbite of upper limb
T95.3|Sequelae of burn, corrosion and frostbite of lower limb
T95.4|Seq burn and corros class only accord extent body surf involved
T95.8|Sequelae of other specified burn, corrosion and frostbite
T95.9|Sequelae of unspecified burn, corrosion and frostbite
T96|Sequelae of poisoning by drugs medicaments and biological substances
T97|Sequelae of toxic effects substances chiefly nonmedicinal as to source
T98|Sequelae of other and unspecified effects of external causes
T98.0|Sequelae of effects foreign body entering through natural orifice
T98.1|Sequelae of other and unspecified effects of external causes
T98.2|Sequelae of certain early complications of trauma
T98.3|Sequelae of complications of surgical and medical care nec
U04|Severe acute respiratory syndrome [SARS]
U04.9|Severe acute respiratory syndrome [SARS], unspecified
U80|Agent resistant to penicillin and related antibiotics
U80.0|Penicillin resistant agent
U80.1|Methicillin resistant agent
U80.8|Agent resistant to other penicillin-related antibiotic
U81|Agent resistant to vancomycin and related antibiotics
U81.0|Vancomycin resistant agent
U81.8|Agent resistant to other penicillin-related antibiotic
U88|Agent resistant to multiple antibiotics
U89|Agent resistant to other and unspecified antibiotics
U89.8|Agent resistant to other single specified antibiotic
U89.9|Agent resistant to unspecified antibiotic
V01|Pedestrian injured in collision with pedal cycle
V01.0|Pedestrian injured in collision with pedal cycle: Nontraffic accident
V01.1|Pedestrian injured in collision with pedal cycle: Traffic accident
V01.9|Pedestrian injured in collision with pedal cycle: Unspecified whether traffic or nontraffic accident
V02|Pedestrian injured in collision with two- or three-wheeled motor vehicle
V02.0|Pedestrian injured in collision with two- or three-wheeled motor vehicle: Nontraffic accident
V02.1|Pedestrian injured in collision with two- or three-wheeled motor vehicle: Traffic accident
V02.9|Pedestrian injured in collision with two- or three-wheeled motor vehicle: Unspecified whether traffic or nontraffic accident
V03|Pedestrian injured in collision with car, pick-up truck or van
V03.0|Pedestrian injured in collision with car, pick-up truck or van: Nontraffic accident
V03.1|Pedestrian injured in collision with car, pick-up truck or van: Traffic accident
V03.9|Pedestrian injured in collision with car, pick-up truck or van: Unspecified whether traffic or nontraffic accident
V04|Pedestrian injured in collision with heavy transport vehicle or bus
V04.0|Pedestrian injured in collision with heavy transport vehicle or bus: Nontraffic accident
V04.1|Pedestrian injured in collision with heavy transport vehicle or bus: Traffic accident
V04.9|Pedestrian injured in collision with heavy transport vehicle or bus: Unspecified whether traffic or nontraffic accident
V05|Pedestrian injured in collision with railway train or railway vehicle
V05.0|Pedestrian injured in collision with railway train or railway vehicle: Nontraffic accident
V05.1|Pedestrian injured in collision with railway train or railway vehicle: Traffic accident
V05.9|Pedestrian injured in collision with railway train or railway vehicle: Unspecified whether traffic or nontraffic accident
V06|Pedestrian injured in collision with other nonmotor vehicle
V06.0|Pedestrian injured in collision with other nonmotor vehicle: Nontraffic accident
V06.1|Pedestrian injured in collision with other nonmotor vehicle: Traffic accident
V06.9|Pedestrian injured in collision with other nonmotor vehicle: Unspecified whether traffic or nontraffic accident
V09|Pedestrian injured in other and unspecified transport accidents
V09.0|Pedestrian injured in nontraffic accident involving other and unspecified motor vehicles
V09.1|Pedestrian injured in unspecified nontraffic accident
V09.2|Pedestrian injured in traffic accident involving other and unspecified motor vehicles
V09.3|Pedestrian injured in unspecified traffic accident
V09.9|Pedestrian injured in unspecified transport accident
V10|Pedal cyclist injured in collision with pedestrian or animal
V10.0|Pedal cyclist injured in collision with pedestrian or animal: Driver injured in nontraffic accident
V10.1|Pedal cyclist injured in collision with pedestrian or animal: Passenger injured in nontraffic accident
V10.2|Pedal cyclist injured in collision with pedestrian or animal: Unspecified pedal cyclist injured in nontraffic accident
V10.3|Pedal cyclist injured in collision with pedestrian or animal: Person injured while boarding or alighting
V10.4|Pedal cyclist injured in collision with pedestrian or animal: Driver injured in traffic accident
V10.5|Pedal cyclist injured in collision with pedestrian or animal: Passenger injured in traffic accident
V10.9|Pedal cyclist injured in collision with pedestrian or animal: Unspecified pedal cyclist injured in traffic accident
V11|Pedal cyclist injured in collision with other pedal cycle
V11.0|Pedal cyclist injured in collision with other pedal cycle: Driver injured in nontraffic accident
V11.1|Pedal cyclist injured in collision with other pedal cycle: Passenger injured in nontraffic accident
V11.2|Pedal cyclist injured in collision with other pedal cycle: Unspecified pedal cyclist injured in nontraffic accident
V11.3|Pedal cyclist injured in collision with other pedal cycle: Person injured while boarding or alighting$ICD$, E'\n')) as x
where x <> ''
on conflict (kode) do update set nama = excluded.nama;

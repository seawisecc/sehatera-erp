-- ============================================================
-- 0026  Isi ICD-10 bagian 1 dari 3 (A00 sampai M51.8)
-- ============================================================
--
-- 7338 kode, dari berkas e-klaim Kemenkes versi ICD10_2010.
--
-- Dipecah bertiga bukan karena rapi, tapi karena satu tempelan 1 MB membuat
-- SQL Editor Supabase tersendat, dan jalur menjalankan SQL di project ini
-- memang lewat sana. Potongannya rata menurut ukuran, bukan menurut bab:
-- bab ICD-10 timpang jauh (bab cedera sendiri hampir seperempat berkas),
-- jadi memotong di batas bab menghasilkan satu bagian yang tetap kebesaran.
-- Urutan kodenya tetap menaik, jadi bagian mana pun masih bisa ditelusuri.
--
-- Isinya dibungkus satu dollar-quote supaya seluruhnya jadi SATU pernyataan
-- dan satu string, bukan 7338 tuple VALUES yang harus diurai satu per satu.
-- Tidak ada tanda kutip yang perlu dilarikan, jadi nama seperti
-- "Crohn's disease" masuk apa adanya. Pemisahnya "|", dan sudah diperiksa:
-- tidak ada satu pun nama di kedua berkas Kemenkes yang memuat "|".
--
-- Bisa dijalankan ulang: `on conflict do update`, jadi menempelkannya dua
-- kali tidak menggandakan apa pun dan tidak mengeluh.

insert into public.icd10 (kode, nama)
select split_part(x, '|', 1), split_part(x, '|', 2)
from unnest(string_to_array($ICD$A00|Cholera
A00.0|Cholera due to vibrio cholerae 01, biovar cholerae
A00.1|Cholera due to vibrio cholerae 01, biovar eltor
A00.9|Cholera, unspecified
A01|Typhoid and paratyphoid fevers
A01.0|Typhoid fever
A01.1|Paratyphoid fever a
A01.2|Paratyphoid fever b
A01.3|Paratyphoid fever c
A01.4|Paratyphoid fever, unspecified
A02|Other salmonella infections
A02.0|Salmonella enteritis
A02.1|Salmonella septicaemia
A02.2|Localized salmonella infections
A02.8|Other specified salmonella infections
A02.9|Salmonella infection, unspecified
A03|Shigellosis
A03.0|Shigellosis due to shigella dysenteriae
A03.1|Shigellosis due to shigella flexneri
A03.2|Shigellosis due to shigella boydii
A03.3|Shigellosis due to shigella sonnei
A03.8|Other shigellosis
A03.9|Shigellosis, unspecified
A04|Other bacterial intestinal infections
A04.0|Enteropathogenic escherichia coli infection
A04.1|Enterotoxigenic escherichia coli infection
A04.2|Enteroinvasive escherichia coli infection
A04.3|Enterohaemorrhagic escherichia coli infection
A04.4|Other intestinal escherichia coli infections
A04.5|Campylobacter enteritis
A04.6|Enteritis due to yersinia enterocolitica
A04.7|Enterocolitis due to clostridium difficile
A04.8|Other specified bacterial intestinal infections
A04.9|Bacterial intestinal infection, unspecified
A05|Other bacterial foodborne intoxications, not elsewhere classified
A05.0|Foodborne staphylococcal intoxication
A05.1|Botulism
A05.2|Foodborne clostridium perfringens intoxication
A05.3|Foodborne vibrio parahaemolyticus intoxication
A05.4|Foodborne bacillus cereus intoxication
A05.8|Other specified bacterial foodborne intoxications
A05.9|Bacterial foodborne intoxication, unspecified
A06|Amoebiasis
A06.0|Acute amoebic dysentery
A06.1|Chronic intestinal amoebiasis
A06.2|Amoebic nondysenteric colitis
A06.3|Amoeboma of intestine
A06.4|Amoebic liver abscess
A06.5|Amoebic lung abscess
A06.6|Amoebic brain abscess
A06.7|Cutaneous amoebiasis
A06.8|Amoebic infection of other sites
A06.9|Amoebiasis, unspecified
A07|Other protozoal intestinal diseases
A07.0|Balantidiasis
A07.1|Giardiasis [lambliasis]
A07.2|Cryptosporidiosis
A07.3|Isosporiasis
A07.8|Other specified protozoal intestinal diseases
A07.9|Protozoal intestinal disease, unspecified
A08|Viral and other specified intestinal infections
A08.0|Rotaviral enteritis
A08.1|Acute gastroenteropathy due to norwalk agent
A08.2|Adenoviral enteritis
A08.3|Other viral enteritis
A08.4|Viral intestinal infection, unspecified
A08.5|Other specified intestinal infections
A09|Diarrhoea and gastroenteritis of presumed infectious origin
A09.0|Other and unspecified gastroenteritis and colitis of infectious origin
A09.9|Gastroenteritis and colitis of unspecified origin
A15|Respiratory tuberculosis, bacteriologically and histologically confirmed
A15.0|Tb lung confirm sputum microscopy with or without culture
A15.1|Tuberculosis of lung, confirmed by culture only
A15.2|Tuberculosis of lung, confirmed histologically
A15.3|Tuberculosis of lung, confirmed by unspecified means
A15.4|Tb intrathoracic lymph nodes confirm bact histologically
A15.5|Tuberculosis of larynx, trachea & bronchus conf bact/hist'y
A15.6|Tuberculous pleurisy, conf bacteriologically/his'y
A15.7|Primary respiratory tb confirm bact and histologically
A15.8|Other respiratory tb confirm bact and histologically
A15.9|Respiratory tb unspec confirm bact and histologically
A16|Respiratory tuberculosis, not confirmed bacteriologically or histologically
A16.0|Tuberculosis of lung, bacteriologically & histolog'y neg
A16.1|Tuberculosis lung bact and histological examin not done
A16.2|Tb lung without mention of bact or histological confirm
A16.3|Tb intrathoracic lymph node without bact or hist confirm
A16.4|Tb larynx trachea and bronchus without bact or hist confirm
A16.5|Tb pleurisy without mention of bact or histological confirm
A16.7|Prim respiratory tb without mention of bact or hist confirm
A16.8|Oth respiratory tb without mention of bact or hist confirm
A16.9|Resp tb unspec without mention of bact or hist confirm
A17|Tuberculosis of nervous system
A17.0|Tuberculous meningitis
A17.1|Meningeal tuberculoma
A17.8|Other tuberculosis of nervous system
A17.9|Tuberculosis of nervous system unspecified
A18|Tuberculosis of other organs
A18.0|Tuberculosis of bones and joints
A18.1|Tuberculosis of genitourinary system
A18.2|Tuberculous peripheral lymphadenopathy
A18.3|Tuberculosis of intestines, peritoneum and mesenteric glands
A18.4|Tuberculosis of skin and subcutaneous tissue
A18.5|Tuberculosis of eye
A18.6|Tuberculosis of ear
A18.7|Tuberculosis of adrenal glands
A18.8|Tuberculosis of other specified organs
A19|Miliary tuberculosis
A19.0|Acute miliary tuberculosis of a single specified site
A19.1|Acute miliary tuberculosis of multiple sites
A19.2|Acute miliary tuberculosis, unspecified
A19.8|Other miliary tuberculosis
A19.9|Miliary tuberculosis, unspecified
A20|Plague
A20.0|Bubonic plague
A20.1|Cellulocutaneous plague
A20.2|Pneumonic plague
A20.3|Plague meningitis
A20.7|Septicaemic plague
A20.8|Other forms of plague
A20.9|Plague, unspecified
A21|Tularaemia
A21.0|Ulceroglandular tularaemia
A21.1|Oculoglandular tularaemia
A21.2|Pulmonary tularaemia
A21.3|Gastrointestinal tularaemia
A21.7|Generalized tularaemia
A21.8|Other forms of tularaemia
A21.9|Tularaemia, unspecified
A22|Anthrax
A22.0|Cutaneous anthrax
A22.1|Pulmonary anthrax
A22.2|Gastrointestinal anthrax
A22.7|Anthrax septicaemia
A22.8|Other forms of anthrax
A22.9|Anthrax, unspecified
A23|Brucellosis
A23.0|Brucellosis due to brucella melitensis
A23.1|Brucellosis due to brucella abortus
A23.2|Brucellosis due to brucella suis
A23.3|Brucellosis due to brucella canis
A23.8|Other brucellosis
A23.9|Brucellosis, unspecified
A24|Glanders and melioidosis
A24.0|Glanders
A24.1|Acute and fulminating melioidosis
A24.2|Subacute and chronic melioidosis
A24.3|Other melioidosis
A24.4|Melioidosis, unspecified
A25|Rat-bite fevers
A25.0|Spirillosis
A25.1|Streptobacillosis
A25.9|Rat-bite fever, unspecified
A26|Erysipeloid
A26.0|Cutaneous erysipeloid
A26.7|Erysipelothrix septicaemia
A26.8|Other forms of erysipeloid
A26.9|Erysipeloid, unspecified
A27|Leptospirosis
A27.0|Leptospirosis icterohaemorrhagica
A27.8|Other forms of leptospirosis
A27.9|Leptospirosis, unspecified
A28|Other zoonotic bacterial diseases, not elsewhere classified
A28.0|Pasteurellosis
A28.1|Cat-scratch disease
A28.2|Extraintestinal yersiniosis
A28.8|Other specified zoonotic bacterial diseases nec
A28.9|Zoonotic bacterial disease, unspecified
A30|Leprosy [Hansen disease]
A30.0|Indeterminate leprosy
A30.1|Tuberculoid leprosy
A30.2|Borderline tuberculoid leprosy
A30.3|Borderline leprosy
A30.4|Borderline lepromatous leprosy
A30.5|Lepromatous leprosy
A30.8|Other forms of leprosy
A30.9|Leprosy, unspecified
A31|Infection due to other mycobacteria
A31.0|Pulmonary mycobacterial infection
A31.1|Cutaneous mycobacterial infection
A31.8|Other mycobacterial infections
A31.9|Mycobacterial infection, unspecified
A32|Listeriosis
A32.0|Cutaneous listeriosis
A32.1|Listerial meningitis and meningoencephalitis
A32.7|Listerial septicaemia
A32.8|Other forms of listeriosis
A32.9|Listeriosis, unspecified
A33|Tetanus neonatorum
A34|Obstetrical tetanus
A35|Other tetanus
A36|Diphtheria
A36.0|Pharyngeal diphtheria
A36.1|Nasopharyngeal diphtheria
A36.2|Laryngeal diphtheria
A36.3|Cutaneous diphtheria
A36.8|Other diphtheria
A36.9|Diphtheria, unspecified
A37|Whooping cough
A37.0|Whooping cough due to bordetella pertussis
A37.1|Whooping cough due to bordetella parapertussis
A37.8|Whooping cough due to other bordetella species
A37.9|Whooping cough, unspecified
A38|Scarlet fever
A39|Meningococcal infection
A39.0|Meningococcal meningitis
A39.1|Waterhouse-friderichsen syndrome
A39.2|Acute meningococcaemia
A39.3|Chronic meningococcaemia
A39.4|Meningococcaemia, unspecified
A39.5|Meningococcal heart disease
A39.8|Other meningococcal infections
A39.9|Meningococcal infection, unspecified
A40|Streptococcal sepsis
A40.0|Septicaemia due to streptococcus, group a
A40.1|Septicaemia due to streptococcus, group b
A40.2|Septicaemia due to streptococcus, group d
A40.3|Septicaemia due to streptococcus pneumoniae
A40.8|Other streptococcal septicaemia
A40.9|Streptococcal septicaemia, unspecified
A41|Other sepsis
A41.0|Septicaemia due to staphylococcus aureus
A41.1|Septicaemia due to other specified staphylococcus
A41.2|Septicaemia due to unspecified staphylococcus
A41.3|Septicaemia due to haemophilus influenzae
A41.4|Septicaemia due to anaerobes
A41.5|Septicaemia due to other gram-negative organisms
A41.8|Other specified septicaemia
A41.9|Septicaemia, unspecified
A42|Actinomycosis
A42.0|Pulmonary actinomycosis
A42.1|Abdominal actinomycosis
A42.2|Cervicofacial actinomycosis
A42.7|Actinomycotic septicaemia
A42.8|Other forms of actinomycosis
A42.9|Actinomycosis, unspecified
A43|Nocardiosis
A43.0|Pulmonary nocardiosis
A43.1|Cutaneous nocardiosis
A43.8|Other forms of nocardiosis
A43.9|Nocardiosis, unspecified
A44|Bartonellosis
A44.0|Systemic bartonellosis
A44.1|Cutaneous and mucocutaneous bartonellosis
A44.8|Other forms of bartonellosis
A44.9|Bartonellosis, unspecified
A46|Erysipelas
A48|Other bacterial diseases, not elsewhere classified
A48.0|Gas gangrene
A48.1|Legionnaires' disease
A48.2|Nonpneumonic legionnaires' disease [pontiac fever]
A48.3|Toxic shock syndrome
A48.4|Brazilian purpuric fever
A48.8|Other specified bacterial diseases
A49|Bacterial infection of unspecified site
A49.0|Staphylococcal infection, unspecified
A49.1|Streptococcal infection, unspecified
A49.2|Haemophilus influenzae infection, unspecified
A49.3|Mycoplasma infection, unspecified
A49.8|Other bacterial infections of unspecified site
A49.9|Bacterial infection, unspecified
A50|Congenital syphilis
A50.0|Early congenital syphilis, symptomatic
A50.1|Early congenital syphilis, latent
A50.2|Early congenital syphilis, unspecified
A50.3|Late congenital syphilitic oculopathy
A50.4|Late congenital neurosyphilis [juvenile neurosyphilis]
A50.5|Other late congenital syphilis, symptomatic
A50.6|Late congenital syphilis, latent
A50.7|Late congenital syphilis, unspecified
A50.9|Congenital syphilis, unspecified
A51|Early syphilis
A51.0|Primary genital syphilis
A51.1|Primary anal syphilis
A51.2|Primary syphilis of other sites
A51.3|Secondary syphilis of skin and mucous membranes
A51.4|Other secondary syphilis
A51.5|Early syphilis, latent
A51.9|Early syphilis, unspecified
A52|Late syphilis
A52.0|Cardiovascular syphilis
A52.1|Symptomatic neurosyphilis
A52.2|Asymptomatic neurosyphilis
A52.3|Neurosyphilis, unspecified
A52.7|Other symptomatic late syphilis
A52.8|Late syphilis, latent
A52.9|Late syphilis, unspecified
A53|Other and unspecified syphilis
A53.0|Latent syphilis, unspecified as early or late
A53.9|Syphilis, unspecified
A54|Gonococcal infection
A54.0|Gonococcal infection lower genitourinary tract without periurethral / accessory gland abscess
A54.1|Gonococcal infection lower genitourinary tract with periurethral / accessory gland abscess
A54.2|Gonococcal pelviperitonitis and other gonococcal genitourinary infections
A54.3|Gonococcal infection of eye
A54.4|Gonococcal infection of musculoskeletal system
A54.5|Gonococcal pharyngitis
A54.6|Gonococcal infection of anus and rectum
A54.8|Other gonococcal infections
A54.9|Gonococcal infection, unspecified
A55|Chlamydial lymphogranuloma (venereum)
A56|Other sexually transmitted chlamydial diseases
A56.0|Chlamydial infection of lower genitourinary tract
A56.1|Chlamydial infection of pelviperitoneum other genitourinary organs
A56.2|Chlamydial infection of genitourinary tract, unspecified
A56.3|Chlamydial infection of anus and rectum
A56.4|Chlamydial infection of pharynx
A56.8|Sexually transmitted chlamydial infection of other sites
A57|Chancroid
A58|Granuloma inguinale
A59|Trichomoniasis
A59.0|Urogenital trichomoniasis
A59.8|Trichomoniasis of other sites
A59.9|Trichomoniasis, unspecified
A60|Anogenital herpesviral [herpes simplex] infection
A60.0|Herpesviral infection of genitalia and urogenital tract
A60.1|Herpesviral infection of perianal skin and rectum
A60.9|Anogenital herpesviral infection, unspecified
A63|Other predominantly sexually transmitted diseases, not elsewhere classified
A63.0|Anogenital (venereal) warts
A63.8|Other specified predominantly sexually transmitted diseases
A64|Unspecified sexually transmitted disease
A65|Nonvenereal syphilis
A66|Yaws
A66.0|Initial lesions of yaws
A66.1|Multiple papillomata and wet crab yaws
A66.2|Other early skin lesions of yaws
A66.3|Hyperkeratosis of yaws
A66.4|Gummata and ulcers of yaws
A66.5|Gangosa
A66.6|Bone and joint lesions of yaws
A66.7|Other manifestations of yaws
A66.8|Latent yaws
A66.9|Yaws, unspecified
A67|Pinta [carate]
A67.0|Primary lesions of pinta
A67.1|Intermediate lesions of pinta
A67.2|Late lesions of pinta
A67.3|Mixed lesions of pinta
A67.9|Pinta, unspecified
A68|Relapsing fevers
A68.0|Louse-borne relapsing fever
A68.1|Tick-borne relapsing fever
A68.9|Relapsing fever, unspecified
A69|Other spirochaetal infections
A69.0|Necrotizing ulcerative stomatitis
A69.1|Other vincent's infections
A69.2|Lyme disease
A69.8|Other specified spirochaetal infections
A69.9|Spirochaetal infection, unspecified
A70|Chlamydia psittaci infection
A71|Trachoma
A71.0|Initial stage of trachoma
A71.1|Active stage of trachoma
A71.9|Trachoma, unspecified
A74|Other diseases caused by chlamydiae
A74.0|Chlamydial conjunctivitis
A74.8|Other chlamydial diseases
A74.9|Chlamydial infection, unspecified
A75|Typhus fever
A75.0|Epidemic louse-borne typhus fever due to rickettsia prowazekii
A75.1|Recrudescent typhus [brill's disease]
A75.2|Typhus fever due to rickettsia typhi
A75.3|Typhus fever due to rickettsia tsutsugamushi
A75.9|Typhus fever, unspecified
A77|Spotted fever [tick-borne rickettsioses]
A77.0|Spotted fever due to rickettsia rickettsii
A77.1|Spotted fever due to rickettsia conorii
A77.2|Spotted fever due to rickettsia sibirica
A77.3|Spotted fever due to rickettsia australis
A77.8|Other spotted fevers
A77.9|Spotted fever, unspecified
A78|Q fever
A79|Other rickettsioses
A79.0|Trench fever
A79.1|Rickettsialpox due to rickettsia akari
A79.8|Other specified rickettsioses
A79.9|Rickettsiosis, unspecified
A80|Acute poliomyelitis
A80.0|Acute paralytic poliomyelitis, vaccine-associated
A80.1|Acute paralytic poliomyelitis, wild virus, imported
A80.2|Acute paralytic poliomyelitis, wild virus, indigenous
A80.3|Acute paralytic poliomyelitis, other and unspecified
A80.4|Acute nonparalytic poliomyelitis
A80.9|Acute poliomyelitis, unspecified
A81|Atypical virus infections of central nervous system
A81.0|Creutzfeldt-jakob disease
A81.1|Subacute sclerosing panencephalitis
A81.2|Progressive multifocal leukoencephalopathy
A81.8|Other atypical virus infections of central nervous system
A81.9|Atypical virus infection of central nervous system, unspecified
A82|Rabies
A82.0|Sylvatic rabies
A82.1|Urban rabies
A82.9|Rabies, unspecified
A83|Mosquito-borne viral encephalitis
A83.0|Japanese encephalitis
A83.1|Western equine encephalitis
A83.2|Eastern equine encephalitis
A83.3|St louis encephalitis
A83.4|Australian encephalitis
A83.5|California encephalitis
A83.6|Rocio virus disease
A83.8|Other mosquito-borne viral encephalitis
A83.9|Mosquito-borne viral encephalitis, unspecified
A84|Tick-borne viral encephalitis
A84.0|Far east tick-born enceph-russn spring-summ enceph
A84.1|Central european tick-borne encephalitis
A84.8|Other tick-borne viral encephalitis
A84.9|Tick-borne viral encephalitis, unspecified
A85|Other viral encephalitis, not elsewhere classified
A85.0|Enteroviral encephalitis
A85.1|Adenoviral encephalitis
A85.2|Arthropod-borne viral encephalitis, unspecified
A85.8|Other specified viral encephalitis
A86|Unspecified viral encephalitis
A87|Viral meningitis
A87.0|Enteroviral meningitis
A87.1|Adenoviral meningitis
A87.2|Lymphocytic choriomeningitis
A87.8|Other viral meningitis
A87.9|Viral meningitis, unspecified
A88|Other viral infections of central nervous system, not elsewhere classified
A88.0|Enteroviral exanthematous fever [boston exanthem]
A88.1|Epidemic vertigo
A88.8|Other specified viral infections of central nervous system
A89|Unspecified viral infection of central nervous system
A90|Dengue fever [classical dengue]
A91|Dengue haemorrhagic fever
A92|Other mosquito-borne viral fevers
A92.0|Chikungunya virus disease
A92.1|O'nyong-nyong fever
A92.2|Venezuelan equine fever
A92.3|West nile fever
A92.4|Rift valley fever
A92.8|Other specified mosquito-borne viral fevers
A92.9|Mosquito-borne viral fever, unspecified
A93|Other arthropod-borne viral fevers, not elsewhere classified
A93.0|Oropouche virus disease
A93.1|Sandfly fever
A93.2|Colorado tick fever
A93.8|Other specified arthropod-borne viral fevers
A94|Unspecified arthropod-borne viral fever
A95|Yellow fever
A95.0|Sylvatic yellow fever
A95.1|Urban yellow fever
A95.9|Yellow fever, unspecified
A96|Arenaviral haemorrhagic fever
A96.0|Junin haemorrhagic fever
A96.1|Machupo haemorrhagic fever
A96.2|Lassa fever
A96.8|Other arenaviral haemorrhagic fevers
A96.9|Arenaviral haemorrhagic fever, unspecified
A98|Other viral haemorrhagic fevers, not elsewhere classified
A98.0|Crimean-congo haemorrhagic fever
A98.1|Omsk haemorrhagic fever
A98.2|Kyasanur forest disease
A98.3|Marburg virus disease
A98.4|Ebola virus disease
A98.5|Haemorrhagic fever with renal syndrome
A98.8|Other specified viral haemorrhagic fevers
A99|Unspecified viral haemorrhagic fever
B00|Herpesviral [herpes simplex] infections
B00.0|Eczema herpeticum
B00.1|Herpesviral vesicular dermatitis
B00.2|Herpesviral gingivostomatitis and pharyngotonsillitis
B00.3|Herpesviral meningitis
B00.4|Herpesviral encephalitis
B00.5|Herpesviral ocular disease
B00.7|Disseminated herpesviral disease
B00.8|Other forms of herpesviral infection
B00.9|Herpesviral infection, unspecified
B01|Varicella [chickenpox]
B01.0|Varicella meningitis
B01.1|Varicella encephalitis
B01.2|Varicella pneumonia
B01.8|Varicella with other complications
B01.9|Varicella without complication
B02|Zoster [herpes zoster]
B02.0|Zoster encephalitis
B02.1|Zoster meningitis
B02.2|Zoster with other nervous system involvement
B02.3|Zoster ocular disease
B02.7|Disseminated zoster
B02.8|Zoster with other complications
B02.9|Zoster without complication
B03|Smallpox
B04|Monkeypox
B05|Measles
B05.0|Measles complicated by encephalitis
B05.1|Measles complicated by meningitis
B05.2|Measles complicated by pneumonia
B05.3|Measles complicated by otitis media
B05.4|Measles with intestinal complications
B05.8|Measles with other complications
B05.9|Measles without complication
B06|Rubella [German measles]
B06.0|Rubella with neurological complications
B06.8|Rubella with other complications
B06.9|Rubella without complication
B07|Viral warts
B08|Other viral infections characterized by skin and mucous membrane lesions, not elsewhere classified
B08.0|Other orthopoxvirus infections
B08.1|Molluscum contagiosum
B08.2|Exanthema subitum [sixth disease]
B08.3|Erythema infectiosum [fifth disease]
B08.4|Enteroviral vesicular stomatitis with exanthem
B08.5|Enteroviral vesicular pharyngitis
B08.6|Exanthematic febrile disease (MEXICO)
B08.8|Other specified viral infections characterized skin / mucous membrane lesions
B09|Unspecified viral infection characterized skin / mucous membrane lesions
B15|Acute hepatitis A
B15.0|Hepatitis a with hepatic coma
B15.9|Hepatitis a without hepatic coma
B16|Acute hepatitis B
B16.0|Acute hepatitis b with delta-agent (coinfection) with hepatitis coma
B16.1|Acute hepatitis b with delta-agent (coinfection) without hepatitis coma
B16.2|Acute hepatitis b without delta-agent with hepatic coma
B16.9|Acute hepatitis b without delta-agent and without hepatatitis coma
B17|Other acute viral hepatitis
B17.0|Acute delta-(super)infection of hepatitis b carrier
B17.1|Acute hepatitis c
B17.2|Acute hepatitis e
B17.8|Other specified acute viral hepatitis
B17.9|Acute viral hepatitis, unspecified
B18|Chronic viral hepatitis
B18.0|Chronic viral hepatitis b with delta-agent
B18.1|Chronic viral hepatitis b without delta-agent
B18.2|Chronic viral hepatitis c
B18.8|Other chronic viral hepatitis
B18.9|Chronic viral hepatitis, unspecified
B19|Unspecified viral hepatitis
B19.0|Unspecified viral hepatitis hepatic with coma
B19.9|Unspecified viral hepatitis without hepatic coma
B20|Human immunodeficiency virus [HIV] disease resulting in infectious and parasitic diseases
B20.0|HIV disease resulting in mycobacterial infection
B20.1|HIV disease resulting in other bacterial infections
B20.2|HIV disease resulting in cytomegaloviral disease
B20.3|HIV disease resulting in other viral infections
B20.4|HIV disease resulting in candidiasis
B20.5|HIV disease resulting in other mycoses
B20.6|HIV disease resulting in pneumocystis carinii pneumonia
B20.7|HIV disease resulting in multiple infections
B20.8|HIV disease resulting in other infectious and parasitic disease
B20.9|HIV disease resulting in unspecified infectious or parasitic disease
B21|Human immunodeficiency virus [HIV] disease resulting in malignant neoplasms
B21.0|HIV disease resulting in kaposi's sarcoma
B21.1|HIV disease resulting in burkitt's lymphoma
B21.2|HIV dis resulting oth types of non-hodgkin's lymphoma
B21.3|HIV dis result oth mal neo lymphoid haematopoietic rel tis
B21.7|HIV disease resulting in multiple malignant neoplasms
B21.8|HIV disease resulting in other malignant neoplasms
B21.9|HIV disease resulting in unspecified malignant neoplasm
B22|Human immunodeficiency virus [HIV] disease resulting in other specified diseases
B22.0|HIV disease resulting in encephalopathy
B22.1|HIV disease resulting in lymphoid interstitial pneumonitis
B22.2|HIV disease resulting in wasting syndrome
B22.7|HIV dis resulting in multiple diseases classif elsewhere
B23|Human immunodeficiency virus [HIV] disease resulting in other conditions
B23.0|Acute HIV infection syndrome
B23.1|HIV dis result (persistent) generalized lymphadenopathy
B23.2|HIV dis result haematologic / immunologic abnorm nec
B23.8|HIV disease resulting in other specified conditions
B24|Unspecified human immunodeficiency virus [hiv] disease
B25|Cytomegaloviral disease
B25.0|Cytomegaloviral pneumonitis
B25.1|Cytomegaloviral hepatitis
B25.2|Cytomegaloviral pancreatitis
B25.8|Other cytomegaloviral diseases
B25.9|Cytomegaloviral disease, unspecified
B26|Mumps
B26.0|Mumps orchitis
B26.1|Mumps meningitis
B26.2|Mumps encephalitis
B26.3|Mumps pancreatitis
B26.8|Mumps with other complications
B26.9|Mumps without complication
B27|Infectious mononucleosis
B27.0|Gammaherpesviral mononucleosis
B27.1|Cytomegaloviral mononucleosis
B27.8|Other infectious mononucleosis
B27.9|Infectious mononucleosis, unspecified
B30|Viral conjunctivitis
B30.0|Keratoconjunctivitis due to adenovirus
B30.1|Conjunctivitis due to adenovirus
B30.2|Viral pharyngoconjunctivitis
B30.3|Acute epid haemorrhagic conjunctivitis (enteroviral)
B30.8|Other viral conjunctivitis
B30.9|Viral conjunctivitis, unspecified
B33|Other viral diseases, not elsewhere classified
B33.0|Epidemic myalgia
B33.1|Ross river disease
B33.2|Viral carditis
B33.3|Retrovirus infections, not elsewhere classified
B33.4|Hantavirus (cardio-)pulmonary syndrome [HPS] [HCPS]
B33.8|Other specified viral diseases
B34|Viral infection of unspecified site
B34.0|Adenovirus infection, unspecified
B34.1|Enterovirus infection, unspecified
B34.2|Coronavirus infection, unspecified
B34.3|Parvovirus infection, unspecified
B34.4|Papovavirus infection, unspecified
B34.8|Other viral infections of unspecified site
B34.9|Viral infection, unspecified
B35|Dermatophytosis
B35.0|Tinea barbae and tinea capitis
B35.1|Tinea unguium
B35.2|Tinea manuum
B35.3|Tinea pedis
B35.4|Tinea corporis
B35.5|Tinea imbricata
B35.6|Tinea cruris
B35.8|Other dermatophytoses
B35.9|Dermatophytosis, unspecified
B36|Other superficial mycoses
B36.0|Pityriasis versicolor
B36.1|Tinea nigra
B36.2|White piedra
B36.3|Black piedra
B36.8|Other specified superficial mycoses
B36.9|Superficial mycosis, unspecified
B37|Candidiasis
B37.0|Candidal stomatitis
B37.1|Pulmonary candidiasis
B37.2|Candidiasis of skin and nail
B37.3|Candidiasis of vulva and vagina
B37.4|Candidiasis of other urogenital sites
B37.5|Candidal meningitis
B37.6|Candidal endocarditis
B37.7|Candidal septicaemia
B37.8|Candidiasis of other sites
B37.9|Candidiasis, unspecified
B38|Coccidioidomycosis
B38.0|Acute pulmonary coccidioidomycosis
B38.1|Chronic pulmonary coccidioidomycosis
B38.2|Pulmonary coccidioidomycosis, unspecified
B38.3|Cutaneous coccidioidomycosis
B38.4|Coccidioidomycosis meningitis
B38.7|Disseminated coccidioidomycosis
B38.8|Other forms of coccidioidomycosis
B38.9|Coccidioidomycosis, unspecified
B39|Histoplasmosis
B39.0|Acute pulmonary histoplasmosis capsulati
B39.1|Chronic pulmonary histoplasmosis capsulati
B39.2|Pulmonary histoplasmosis capsulati, unspecified
B39.3|Disseminated histoplasmosis capsulati
B39.4|Histoplasmosis capsulati, unspecified
B39.5|Histoplasmosis duboisii
B39.9|Histoplasmosis, unspecified
B40|Blastomycosis
B40.0|Acute pulmonary blastomycosis
B40.1|Chronic pulmonary blastomycosis
B40.2|Pulmonary blastomycosis, unspecified
B40.3|Cutaneous blastomycosis
B40.7|Disseminated blastomycosis
B40.8|Other forms of blastomycosis
B40.9|Blastomycosis, unspecified
B41|Paracoccidioidomycosis
B41.0|Pulmonary paracoccidioidomycosis
B41.7|Disseminated paracoccidioidomycosis
B41.8|Other forms of paracoccidioidomycosis
B41.9|Paracoccidioidomycosis, unspecified
B42|Sporotrichosis
B42.0|Pulmonary sporotrichosis
B42.1|Lymphocutaneous sporotrichosis
B42.7|Disseminated sporotrichosis
B42.8|Other forms of sporotrichosis
B42.9|Sporotrichosis, unspecified
B43|Chromomycosis and phaeomycotic abscess
B43.0|Cutaneous chromomycosis
B43.1|Phaeomycotic brain abscess
B43.2|Subcutaneous phaeomycotic abscess and cyst
B43.8|Other forms of chromomycosis
B43.9|Chromomycosis, unspecified
B44|Aspergillosis
B44.0|Invasive pulmonary aspergillosis
B44.1|Other pulmonary aspergillosis
B44.2|Tonsillar aspergillosis
B44.7|Disseminated aspergillosis
B44.8|Other forms of aspergillosis
B44.9|Aspergillosis, unspecified
B45|Cryptococcosis
B45.0|Pulmonary cryptococcosis
B45.1|Cerebral cryptococcosis
B45.2|Cutaneous cryptococcosis
B45.3|Osseous cryptococcosis
B45.7|Disseminated cryptococcosis
B45.8|Other forms of cryptococcosis
B45.9|Cryptococcosis, unspecified
B46|Zygomycosis
B46.0|Pulmonary mucormycosis
B46.1|Rhinocerebral mucormycosis
B46.2|Gastrointestinal mucormycosis
B46.3|Cutaneous mucormycosis
B46.4|Disseminated mucormycosis
B46.5|Mucormycosis, unspecified
B46.8|Other zygomycoses
B46.9|Zygomycosis, unspecified
B47|Mycetoma
B47.0|Eumycetoma
B47.1|Actinomycetoma
B47.9|Mycetoma, unspecified
B48|Other mycoses, not elsewhere classified
B48.0|Lobomycosis
B48.1|Rhinosporidiosis
B48.2|Allescheriasis
B48.3|Geotrichosis
B48.4|Penicillosis
B48.7|Opportunistic mycoses
B48.8|Other specified mycoses
B49|Unspecified mycosis
B50|Plasmodium falciparum malaria
B50.0|Plasmodium falciparum malaria with cerebral complications
B50.8|Other severe and complicated plasmodium falciparum malaria
B50.9|Plasmodium falciparum malaria, unspecified
B51|Plasmodium vivax malaria
B51.0|Plasmodium vivax malaria with rupture of spleen
B51.8|Plasmodium vivax malaria with other complications
B51.9|Plasmodium vivax malaria without complication
B52|Plasmodium malariae malaria
B52.0|Plasmodium malariae malaria with nephropathy
B52.8|Plasmodium malariae malaria with other complications
B52.9|Plasmodium malariae malaria without complication
B53|Other parasitologically confirmed malaria
B53.0|Plasmodium ovale malaria
B53.1|Malaria due to simian plasmodia
B53.8|Other parasitologically confirmed malaria nec
B54|Unspecified malaria
B55|Leishmaniasis
B55.0|Visceral leishmaniasis
B55.1|Cutaneous leishmaniasis
B55.2|Mucocutaneous leishmaniasis
B55.9|Leishmaniasis, unspecified
B56|African trypanosomiasis
B56.0|Gambiense trypanosomiasis
B56.1|Rhodesiense trypanosomiasis
B56.9|African trypanosomiasis, unspecified
B57|Chagas disease
B57.0|Acute chagas' disease with heart involvement
B57.1|Acute chagas' disease without heart involvement
B57.2|Chagas' disease (chronic) with heart involvement
B57.3|Chagas' disease (chronic) with digestive system involvement
B57.4|Chagas' disease (chronic) with nervous system involvement
B57.5|Chagas' disease (chronic) with other organ involvement
B58|Toxoplasmosis
B58.0|Toxoplasma oculopathy
B58.1|Toxoplasma hepatitis
B58.2|Toxoplasma meningoencephalitis
B58.3|Pulmonary toxoplasmosis
B58.8|Toxoplasmosis with other organ involvement
B58.9|Toxoplasmosis, unspecified
B59|Pneumocystosis
B60|Other protozoal diseases, not elsewhere classified
B60.0|Babesiosis
B60.1|Acanthamoebiasis
B60.2|Naegleriasis
B60.8|Other specified protozoal diseases
B64|Unspecified protozoal disease
B65|Schistosomiasis [bilharziasis]
B65.0|Schistosom due schis haematobium [urin schistosom]
B65.1|Schistosom due schis mansoni [intest schistosom]
B65.2|Schistosomiasis due to schistosoma japonicum
B65.3|Cercarial dermatitis
B65.8|Other schistosomiases
B65.9|Schistosomiasis, unspecified
B66|Other fluke infections
B66.0|Opisthorchiasis
B66.1|Clonorchiasis
B66.2|Dicrocoeliasis
B66.3|Fascioliasis
B66.4|Paragonimiasis
B66.5|Fasciolopsiasis
B66.8|Other specified fluke infections
B66.9|Fluke infection, unspecified
B67|Echinococcosis
B67.0|Echinococcus granulosus infection of liver
B67.1|Echinococcus granulosus infection of lung
B67.2|Echinococcus granulosus infection of bone
B67.3|Echinococcus granulosus infection, other and multiple sites
B67.4|Echinococcus granulosus infection, unspecified
B67.5|Echinococcus multilocularis infection of liver
B67.6|Echinococcus multilocularis infection oth / multiple sites
B67.7|Echinococcus multilocularis infection, unspecified
B67.8|Echinococcosis, unspecified, of liver
B67.9|Echinococcosis, other and unspecified
B68|Taeniasis
B68.0|Taenia solium taeniasis
B68.1|Taenia saginata taeniasis
B68.9|Taeniasis, unspecified
B69|Cysticercosis
B69.0|Cysticercosis of central nervous system
B69.1|Cysticercosis of eye
B69.8|Cysticercosis of other sites
B69.9|Cysticercosis, unspecified
B70|Diphyllobothriasis and sparganosis
B70.0|Diphyllobothriasis
B70.1|Sparganosis
B71|Other cestode infections
B71.0|Hymenolepiasis
B71.1|Dipylidiasis
B71.8|Other specified cestode infections
B71.9|Cestode infection, unspecified
B72|Dracunculiasis
B73|Onchocerciasis
B74|Filariasis
B74.0|Filariasis due to wuchereria bancrofti
B74.1|Filariasis due to brugia malayi
B74.2|Filariasis due to brugia timori
B74.3|Loiasis
B74.4|Mansonelliasis
B74.8|Other filariases
B74.9|Filariasis, unspecified
B75|Trichinellosis
B76|Hookworm diseases
B76.0|Ancylostomiasis
B76.1|Necatoriasis
B76.8|Other hookworm diseases
B76.9|Hookworm disease, unspecified
B77|Ascariasis
B77.0|Ascariasis with intestinal complications
B77.8|Ascariasis with other complications
B77.9|Ascariasis, unspecified
B78|Strongyloidiasis
B78.0|Intestinal strongyloidiasis
B78.1|Cutaneous strongyloidiasis
B78.7|Disseminated strongyloidiasis
B78.9|Strongyloidiasis, unspecified
B79|Trichuriasis
B80|Enterobiasis
B81|Other intestinal helminthiases, not elsewhere classified
B81.0|Anisakiasis
B81.1|Intestinal capillariasis
B81.2|Trichostrongyliasis
B81.3|Intestinal angiostrongyliasis
B81.4|Mixed intestinal helminthiases
B81.8|Other specified intestinal helminthiases
B82|Unspecified intestinal parasitism
B82.0|Intestinal helminthiasis, unspecified
B82.9|Intestinal parasitism, unspecified
B83|Other helminthiases
B83.0|Visceral larva migrans
B83.1|Gnathostomiasis
B83.2|Angiostrongyliasis due to parastrongylus cantonensis
B83.3|Syngamiasis
B83.4|Internal hirudiniasis
B83.8|Other specified helminthiases
B83.9|Helminthiasis, unspecified
B85|Pediculosis and phthiriasis
B85.0|Pediculosis due to pediculus humanus capitis
B85.1|Pediculosis due to pediculus humanus corporis
B85.2|Pediculosis, unspecified
B85.3|Phthiriasis
B85.4|Mixed pediculosis and phthiriasis
B86|Scabies
B87|Myiasis
B87.0|Cutaneous myiasis
B87.1|Wound myiasis
B87.2|Ocular myiasis
B87.3|Nasopharyngeal myiasis
B87.4|Aural myiasis
B87.8|Myiasis of other sites
B87.9|Myiasis, unspecified
B88|Other infestations
B88.0|Other acariasis
B88.1|Tungiasis [sandflea infestation]
B88.2|Other arthropod infestations
B88.3|External hirudiniasis
B88.8|Other specified infestations
B88.9|Infestation, unspecified
B89|Unspecified parasitic disease
B90|Sequelae of tuberculosis
B90.0|Sequelae of central nervous system tuberculosis
B90.1|Sequelae of genitourinary tuberculosis
B90.2|Sequelae of tuberculosis of bones and joints
B90.8|Sequelae of tuberculosis of other organs
B90.9|Sequelae of respiratory and unspecified tuberculosis
B91|Sequelae of poliomyelitis
B92|Sequelae of leprosy
B94|Sequelae of other and unspecified infectious and parasitic diseases
B94.0|Sequelae of trachoma
B94.1|Sequelae of viral encephalitis
B94.2|Sequelae of viral hepatitis
B94.8|Sequelae of other specified infectious and parasitic diseases
B94.9|Sequelae of unspecified infectious or parasitic disease
B95|Streptococcus and staphylococcus as the cause of diseases classified to other chapters
B95.0|Streptococcus group A as cause of diseases classified to other chapters
B95.1|Streptococcus group B as cause of diseases classified to other chapters
B95.2|Streptococcus group D as cause of diseases classified to other chapters
B95.3|Streptococcus pneumoniae as cause of diseases classified other chapters
B95.4|Other streptococcus as cause of diseases classified to other chapters
B95.5|Unspecified streptococcus as cause of diseases classified to other chapters
B95.6|Staphylococcus aureus as cause of disease classified to other chapters
B95.7|Other staphylococcus as cause of diseases classified to other chapters
B95.8|Unspecified staphylococcus as cause of diseases classified to other chapters
B96|Other specified bacterial agents as the cause of diseases classified to other chapters
B96.0|Mycoplasma pneumoniae as cause diseases classified to other chapters
B96.1|Klebsiella pneumoniae as cause diseases classified to other chapters
B96.2|Escherichia coli as cause diseases classified to other chapters
B96.3|Haemophilus influenzae as cause diseases classified to other chapters
B96.4|Proteus (mirabilis)(morganii) as cause diseases classified to other chapters
B96.5|P.(aerugin)(mallei)(pseudomallei)as cause diseases classified to other chapters
B96.6|Bacillus fragilis as cause diseases classified to other chapters
B96.7|Clostridium perfringens as cause diseases classified to other chapters
B96.8|Other spec bact agents as cause diseases classified to other chapters
B97|Viral agents as the cause of diseases classified to other chapters
B97.0|Adenovirus as the cause of diseases classified to other chapters
B97.1|Enterovirus as the cause of diseases classified to other chapters
B97.2|Coronavirus as the cause of diseases classified to other chapters
B97.3|Retrovirus as the cause of diseases classified to other chapters
B97.4|Resp syncytial virusas the cause of diseases classified to other chapters
B97.5|Reovirus as the cause of diseases classified to other chapters
B97.6|Parvovirus as the cause of diseases classified to other chapters
B97.7|Papillomavirus as the cause of diseases classified to other chapters
B97.8|Oth viral agents as the cause of diseases classified to other chapters
B98|Other specified infectious agents as the cause of diseases classified to other chapters
B98.0|Helicobacter pylori [H.pylori] as the cause of diseases classified to other chapters
B98.1|Vibrio vulnificus as the cause of diseases classified to other chapters
B99|Other and unspecified infectious diseases
C00|Malignant neoplasm of lip
C00.0|Malignant neoplasm, external upper lip
C00.1|Malignant neoplasm, external lower lip
C00.2|Malignant neoplasm, external lip, unspecified
C00.3|Malignant neoplasm, upper lip, inner aspect
C00.4|Malignant neoplasm, lower lip, inner aspect
C00.5|Malignant neoplasm, lip, unspecified, inner aspect
C00.6|Malignant neoplasm, commissure of lip
C00.8|Malignant neoplasm, overlapping lesion of lip
C00.9|Malignant neoplasm, lip, unspecified
C01|Malignant neoplasm of base of tongue
C02|Malignant neoplasm of other and unspecified parts of tongue
C02.0|Malignant neoplasm, dorsal surface of tongue
C02.1|Malignant neoplasm, border of tongue
C02.2|Malignant neoplasm, ventral surface of tongue
C02.3|Malignant neoplasm, anterior two-thirds of tongue, part unspecified
C02.4|Malignant neoplasm, lingual tonsil
C02.8|Malignant neoplasm, overlapping lesion of tongue
C02.9|Malignant neoplasm, tongue, unspecified
C03|Malignant neoplasm of gum
C03.0|Malignant neoplasm, upper gum
C03.1|Malignant neoplasm, lower gum
C03.9|Malignant neoplasm, gum, unspecified
C04|Malignant neoplasm of floor of mouth
C04.0|Malignant neoplasm, anterior floor of mouth
C04.1|Malignant neoplasm, lateral floor of mouth
C04.8|Malignant neoplasm, overlapping lesion of floor of mouth
C04.9|Malignant neoplasm, floor of mouth, unspecified
C05|Malignant neoplasm of palate
C05.0|Malignant neoplasm, hard palate
C05.1|Malignant neoplasm, soft palate
C05.2|Malignant neoplasm, uvula
C05.8|Malignant neoplasm, overlapping lesion of palate
C05.9|Malignant neoplasm, palate, unspecified
C06|Malignant neoplasm of other and unspecified parts of mouth
C06.0|Malignant neoplasm, cheek mucosa
C06.1|Malignant neoplasm, vestibule of mouth
C06.2|Malignant neoplasm, retromolar area
C06.8|Malignant neoplasm, overlapping lesion of other and unspecified parts of mouth
C06.9|Malignant neoplasm, mouth, unspecified
C07|Malignant neoplasm of parotid gland
C08|Malignant neoplasm of other and unspecified major salivary glands
C08.0|Malignant neoplasm, submandibular gland
C08.1|Malignant neoplasm, sublingual gland
C08.8|Malignant neoplasm, overlapping lesion of major salivary glands
C08.9|Malignant neoplasm, major salivary gland, unspecified
C09|Malignant neoplasm of tonsil
C09.0|Malignant neoplasm, tonsillar fossa
C09.1|Malignant neoplasm, tonsillar pillar (anterior)(posterior)
C09.8|Malignant neoplasm, overlapping lesion of tonsil
C09.9|Malignant neoplasm, tonsil, unspecified
C10|Malignant neoplasm of oropharynx
C10.0|Malignant neoplasm, vallecula
C10.1|Malignant neoplasm, anterior surface of epiglottis
C10.2|Malignant neoplasm, lateral wall of oropharynx
C10.3|Malignant neoplasm, posterior wall of oropharynx
C10.4|Malignant neoplasm, branchial cleft
C10.8|Malignant neoplasm, overlapping lesion of oropharynx
C10.9|Malignant neoplasm, oropharynx, unspecified
C11|Malignant neoplasm of nasopharynx
C11.0|Malignant neoplasm, superior wall of nasopharynx
C11.1|Malignant neoplasm, posterior wall of nasopharynx
C11.2|Malignant neoplasm, lateral wall of nasopharynx
C11.3|Malignant neoplasm, anterior wall of nasopharynx
C11.8|Malignant neoplasm, overlapping lesion of nasopharynx
C11.9|Malignant neoplasm, nasopharynx, unspecified
C12|Malignant neoplasm of pyriform sinus
C13|Malignant neoplasm of hypopharynx
C13.0|Malignant neoplasm, postcricoid region
C13.1|Malignant neoplasm, aryepiglottic fold, hypopharyngeal aspect
C13.2|Malignant neoplasm, posterior wall of hypopharynx
C13.8|Malignant neoplasm, overlapping lesion of hypopharynx
C13.9|Malignant neoplasm, hypopharynx, unspecified
C14|Malignant neoplasm of other and ill-defined sites in the lip, oral cavity and pharynx
C14.0|Malignant neoplasm, pharynx, unspecified
C14.1|Malignant neoplasm of laryngopharynx
C14.2|Malignant neoplasm, waldeyer's ring
C14.8|Malignant neoplasm, overlapping lesion of lip, oral cavity and pharynx
C15|Malignant neoplasm of oesophagus
C15.0|Malignant neoplasm, cervical part of oesophagus
C15.1|Malignant neoplasm, thoracic part of oesophagus
C15.2|Malignant neoplasm, abdominal part of oesophagus
C15.3|Malignant neoplasm, upper third of oesophagus
C15.4|Malignant neoplasm, middle third of oesophagus
C15.5|Malignant neoplasm, lower third of oesophagus
C15.8|Malignant neoplasm, overlapping lesion of oesophagus
C15.9|Malignant neoplasm, oesophagus, unspecified
C16|Malignant neoplasm of stomach
C16.0|Malignant neoplasm, cardia
C16.1|Malignant neoplasm, fundus of stomach
C16.2|Malignant neoplasm, body of stomach
C16.3|Malignant neoplasm, pyloric antrum
C16.4|Malignant neoplasm, pylorus
C16.5|Malignant neoplasm, lesser curvature of stomach, unspecified
C16.6|Malignant neoplasm, greater curvature of stomach, unspecified
C16.8|Malignant neoplasm, overlapping lesion of stomach
C16.9|Malignant neoplasm, stomach, unspecified
C17|Malignant neoplasm of small intestine
C17.0|Malignant neoplasm, duodenum
C17.1|Malignant neoplasm, jejunum
C17.2|Malignant neoplasm, ileum
C17.3|Malignant neoplasm, meckel's diverticulum
C17.8|Malignant neoplasm, overlapping lesion of small intestine
C17.9|Malignant neoplasm, small intestine, unspecified
C18|Malignant neoplasm of colon
C18.0|Malignant neoplasm, caecum
C18.1|Malignant neoplasm, appendix
C18.2|Malignant neoplasm, ascending colon
C18.3|Malignant neoplasm, hepatic flexure
C18.4|Malignant neoplasm, transverse colon
C18.5|Malignant neoplasm, splenic flexure
C18.6|Malignant neoplasm, descending colon
C18.7|Malignant neoplasm, sigmoid colon
C18.8|Malignant neoplasm, overlapping lesion of colon
C18.9|Malignant neoplasm, colon, unspecified
C19|Malignant neoplasm of rectosigmoid junction
C20|Malignant neoplasm of rectum
C21|Malignant neoplasm of anus and anal canal
C21.0|Malignant neoplasm, anus, unspecified
C21.1|Malignant neoplasm, anal canal
C21.2|Malignant neoplasm, cloacogenic zone
C21.8|Malignant neoplasm, overlapping lesion of rectum, anus and anal canal
C22|Malignant neoplasm of liver and intrahepatic bile ducts
C22.0|Malignant neoplasm, liver cell carcinoma
C22.1|Malignant neoplasm, intrahepatic bile duct carcinoma
C22.2|Malignant neoplasm, hepatoblastoma
C22.3|Malignant neoplasm, angiosarcoma of liver
C22.4|Malignant neoplasm, other sarcomas of liver
C22.7|Malignant neoplasm, other specified carcinomas of liver
C22.9|Malignant neoplasm, liver, unspecified
C23|Malignant neoplasm of gallbladder
C24|Malignant neoplasm of other and unspecified parts of biliary tract
C24.0|Malignant neoplasm, extrahepatic bile duct
C24.1|Malignant neoplasm, ampulla of vater
C24.8|Malignant neoplasm, overlapping lesion of biliary tract
C24.9|Malignant neoplasm, biliary tract, unspecified
C25|Malignant neoplasm of pancreas
C25.0|Malignant neoplasm, head of pancreas
C25.1|Malignant neoplasm, body of pancreas
C25.2|Malignant neoplasm, tail of pancreas
C25.3|Malignant neoplasm, pancreatic duct
C25.4|Malignant neoplasm, endocrine pancreas
C25.7|Malignant neoplasm, other parts of pancreas
C25.8|Malignant neoplasm, overlapping lesion of pancreas
C25.9|Malignant neoplasm, pancreas, unspecified
C26|Malignant neoplasm of other and ill-defined digestive organs
C26.0|Malignant neoplasm, intestinal tract, part unspecified
C26.1|Malignant neoplasm, spleen
C26.8|Malignant neoplasm, overlapping lesion of digestive system
C26.9|Malignant neoplasm, ill-defined sites within the digestive system
C30|Malignant neoplasm of nasal cavity and middle ear
C30.0|Malignant neoplasm, nasal cavity
C30.1|Malignant neoplasm, middle ear
C31|Malignant neoplasm of accessory sinuses
C31.0|Malignant neoplasm, maxillary sinus
C31.1|Malignant neoplasm, ethmoidal sinus
C31.2|Malignant neoplasm, frontal sinus
C31.3|Malignant neoplasm, sphenoidal sinus
C31.8|Malignant neoplasm, overlapping lesion of accessory sinuses
C31.9|Malignant neoplasm, accessory sinus, unspecified
C32|Malignant neoplasm of larynx
C32.0|Malignant neoplasm, glottis
C32.1|Malignant neoplasm, supraglottis
C32.2|Malignant neoplasm, subglottis
C32.3|Malignant neoplasm, laryngeal cartilage
C32.8|Malignant neoplasm, overlapping lesion of larynx
C32.9|Malignant neoplasm, larynx, unspecified
C33|Malignant neoplasm of trachea
C34|Malignant neoplasm of bronchus and lung
C34.0|Malignant neoplasm, main bronchus
C34.1|Malignant neoplasm, upper lobe, bronchus or lung
C34.2|Malignant neoplasm, middle lobe, bronchus or lung
C34.3|Malignant neoplasm, lower lobe, bronchus or lung
C34.8|Malignant neoplasm, overlapping lesion of bronchus and lung
C34.9|Malignant neoplasm, bronchus or lung, unspecified
C37|Malignant neoplasm of thymus
C38|Malignant neoplasm of heart, mediastinum and pleura
C38.0|Malignant neoplasm, heart
C38.1|Malignant neoplasm, anterior mediastinum
C38.2|Malignant neoplasm, posterior mediastinum
C38.3|Malignant neoplasm, mediastinum, part unspecified
C38.4|Malignant neoplasm, pleura
C38.8|Malignant neoplasm, overlapping lesion of heart, mediastinum and pleura
C39|Malignant neoplasm of other and ill-defined sites in the respiratory system and intrathoracic organs
C39.0|Malignant neoplasm, upper respiratory tract, part unspecified
C39.8|Malignant neoplasm, overlapping lesion of respiratory and intrathoracic organs
C39.9|Malignant neoplasm, ill-defined sites within the respiratory system
C40|Malignant neoplasm of bone and articular cartilage of limbs
C40.0|Malignant neoplasm, scapula and long bones of upper limb
C40.1|Malignant neoplasm, short bones of upper limb
C40.2|Malignant neoplasm, long bones of lower limb
C40.3|Malignant neoplasm, short bones of lower limb
C40.8|Malignant neoplasm, overlapping lesion of bone and articular cartilage of limbs
C40.9|Malignant neoplasm, bone and articular cartilage of limb, unspecified
C41|Malignant neoplasm of bone and articular cartilage of other and unspecified sites
C41.0|Malignant neoplasm, bones of skull and face
C41.1|Malignant neoplasm, mandible
C41.2|Malignant neoplasm, vertebral column
C41.3|Malignant neoplasm, ribs, sternum and clavicle
C41.4|Malignant neoplasm, pelvic bones, sacrum and coccyx
C41.8|Malignant neoplasm, overlapping lesion of bone and articular cartilage
C41.9|Malignant neoplasm, bone and articular cartilage, unspecified
C43|Malignant melanoma of skin
C43.0|Malignant melanoma of lip
C43.1|Malignant melanoma of eyelid, including canthus
C43.2|Malignant melanoma of ear and external auricular canal
C43.3|Malignant melanoma of other and unspecified parts of face
C43.4|Malignant melanoma of scalp and neck
C43.5|Malignant melanoma of trunk
C43.6|Malignant melanoma of upper limb, including shoulder
C43.7|Malignant melanoma of lower limb, including hip
C43.8|Malignant neoplasm, overlapping malignant melanoma of skin
C43.9|Malignant melanoma of skin, unspecified
C44|Other malignant neoplasms of skin
C44.0|Malignant neoplasm, skin of lip
C44.1|Malignant neoplasm, skin of eyelid, including canthus
C44.2|Malignant neoplasm, skin of ear and external auricular canal
C44.3|Malignant neoplasm, skin of other and unspecified parts of face
C44.4|Malignant neoplasm, skin of scalp and neck
C44.5|Malignant neoplasm, skin of trunk
C44.6|Malignant neoplasm, skin of upper limb, including shoulder
C44.7|Malignant neoplasm, skin of lower limb, including hip
C44.8|Malignant neoplasm, overlapping lesion of skin
C44.9|Malignant neoplasm of skin, unspecified
C45|Mesothelioma
C45.0|Mesothelioma of pleura
C45.1|Mesothelioma of peritoneum
C45.2|Mesothelioma of pericardium
C45.7|Mesothelioma of other sites
C45.9|Mesothelioma, unspecified
C46|Kaposi sarcoma
C46.0|Kaposi's sarcoma of skin
C46.1|Kaposi's sarcoma of soft tissue
C46.2|Kaposi's sarcoma of palate
C46.3|Kaposi's sarcoma of lymph nodes
C46.7|Kaposi's sarcoma of other sites
C46.8|Kaposi's sarcoma of multiple organs
C46.9|Kaposi's sarcoma, unspecified
C47|Malignant neoplasm of peripheral nerves and autonomic nervous system
C47.0|Malignant neoplasm, peripheral nerves of head, face and neck
C47.1|Malignant neoplasm, peripheral nerves of upper limb, including shoulder
C47.2|Malignant neoplasm, peripheral nerves of lower limb, including hip
C47.3|Malignant neoplasm, peripheral nerves of thorax
C47.4|Malignant neoplasm, peripheral nerves of abdomen
C47.5|Malignant neoplasm, peripheral nerves of pelvis
C47.6|Malignant neoplasm, peripheral nerves of trunk, unspecified
C47.8|Malignant neoplasm, overlapping lesion peripheral nerve/autonomic nervous syst
C47.9|Malignant neoplasm, peripheral nerves and autonomic nervous system, unspecified
C48|Malignant neoplasm of retroperitoneum and peritoneum
C48.0|Malignant neoplasm, retroperitoneum
C48.1|Malignant neoplasm, specified parts of peritoneum
C48.2|Malignant neoplasm, peritoneum, unspecified
C48.8|Malignant neoplasm, overlapping lesion of retroperitoneum and peritoneum
C49|Malignant neoplasm of other connective and soft tissue
C49.0|Malignant neoplasm, connective and soft tissue of head, face and neck
C49.1|Malignant neoplasm, connective and soft tissue of upper limb, including shoulder
C49.2|Malignant neoplasm, connective and soft tissue of lower limb, including hip
C49.3|Malignant neoplasm, connective and soft tissue of thorax
C49.4|Malignant neoplasm, connective and soft tissue of abdomen
C49.5|Malignant neoplasm, connective and soft tissue of pelvis
C49.6|Malignant neoplasm, connective and soft tissue of trunk, unspecified
C49.8|Malignant neoplasm, overlapping lesion of connective and soft tissue
C49.9|Malignant neoplasm, connective and soft tissue, unspecified
C50|Malignant neoplasm of breast
C50.0|Malignant neoplasm, nipple and areola
C50.1|Malignant neoplasm, central portion of breast
C50.2|Malignant neoplasm, upper-inner quadrant of breast
C50.3|Malignant neoplasm, lower-inner quadrant of breast
C50.4|Malignant neoplasm, upper-outer quadrant of breast
C50.5|Malignant neoplasm, lower-outer quadrant of breast
C50.6|Malignant neoplasm, axillary tail of breast
C50.8|Malignant neoplasm, overlapping lesion of breast
C50.9|Malignant neoplasm, breast, unspecified
C51|Malignant neoplasm of vulva
C51.0|Malignant neoplasm, labium majus
C51.1|Malignant neoplasm, labium minus
C51.2|Malignant neoplasm, clitoris
C51.8|Malignant neoplasm, overlapping lesion of vulva
C51.9|Malignant neoplasm, vulva, unspecified
C52|Malignant neoplasm of vagina
C53|Malignant neoplasm of cervix uteri
C53.0|Malignant neoplasm, endocervix
C53.1|Malignant neoplasm, exocervix
C53.8|Malignant neoplasm, overlapping lesion of cervix uteri
C53.9|Malignant neoplasm, cervix uteri, unspecified
C54|Malignant neoplasm of corpus uteri
C54.0|Malignant neoplasm, isthmus uteri
C54.1|Malignant neoplasm, endometrium
C54.2|Malignant neoplasm, myometrium
C54.3|Malignant neoplasm, fundus uteri
C54.8|Malignant neoplasm, overlapping lesion of corpus uteri
C54.9|Malignant neoplasm, corpus uteri, unspecified
C55|Malignant neoplasm of uterus, part unspecified
C56|Malignant neoplasm of ovary
C57|Malignant neoplasm of other and unspecified female genital organs
C57.0|Malignant neoplasm, fallopian tube
C57.1|Malignant neoplasm, broad ligament
C57.2|Malignant neoplasm, round ligament
C57.3|Malignant neoplasm, parametrium
C57.4|Malignant neoplasm, uterine adnexa, unspecified
C57.7|Malignant neoplasm, other specified female genital organs
C57.8|Malignant neoplasm, overlapping lesion of female genital organs
C57.9|Malignant neoplasm, female genital organ, unspecified
C58|Malignant neoplasm of placenta
C60|Malignant neoplasm of penis
C60.0|Malignant neoplasm, prepuce
C60.1|Malignant neoplasm, glans penis
C60.2|Malignant neoplasm, body of penis
C60.8|Malignant neoplasm, overlapping lesion of penis
C60.9|Malignant neoplasm, penis, unspecified
C61|Malignant neoplasm of prostate
C62|Malignant neoplasm of testis
C62.0|Malignant neoplasm, undescended testis
C62.1|Malignant neoplasm, descended testis
C62.9|Malignant neoplasm, testis, unspecified
C63|Malignant neoplasm of other and unspecified male genital organs
C63.0|Malignant neoplasm, epididymis
C63.1|Malignant neoplasm, spermatic cord
C63.2|Malignant neoplasm, scrotum
C63.7|Malignant neoplasm, other specified male genital organs
C63.8|Malignant neoplasm, overlapping lesion of male genital organs
C63.9|Malignant neoplasm, male genital organ, unspecified
C64|Malignant neoplasm of kidney, except renal pelvis
C65|Malignant neoplasm of renal pelvis
C66|Malignant neoplasm of ureter
C67|Malignant neoplasm of bladder
C67.0|Malignant neoplasm, trigone of bladder
C67.1|Malignant neoplasm, dome of bladder
C67.2|Malignant neoplasm, lateral wall of bladder
C67.3|Malignant neoplasm, anterior wall of bladder
C67.4|Malignant neoplasm, posterior wall of bladder
C67.5|Malignant neoplasm, bladder neck
C67.6|Malignant neoplasm, ureteric orifice
C67.7|Malignant neoplasm, urachus
C67.8|Malignant neoplasm, overlapping lesion of bladder
C67.9|Malignant neoplasm, bladder, unspecified
C68|Malignant neoplasm of other and unspecified urinary organs
C68.0|Malignant neoplasm, urethra
C68.1|Malignant neoplasm, paraurethral gland
C68.8|Malignant neoplasm, overlapping lesion of urinary organs
C68.9|Malignant neoplasm, urinary organ, unspecified
C69|Malignant neoplasm of eye and adnexa
C69.0|Malignant neoplasm, conjunctiva
C69.1|Malignant neoplasm, cornea
C69.2|Malignant neoplasm, retina
C69.3|Malignant neoplasm, choroid
C69.4|Malignant neoplasm, ciliary body
C69.5|Malignant neoplasm, lacrimal gland and duct
C69.6|Malignant neoplasm, orbit
C69.8|Malignant neoplasm, overlapping lesion of eye and adnexa
C69.9|Malignant neoplasm, eye, unspecified
C70|Malignant neoplasm of meninges
C70.0|Malignant neoplasm, cerebral meninges
C70.1|Malignant neoplasm, spinal meninges
C70.9|Malignant neoplasm, meninges, unspecified
C71|Malignant neoplasm of brain
C71.0|Malignant neoplasm, cerebrum, except lobes and ventricles
C71.1|Malignant neoplasm, frontal lobe
C71.2|Malignant neoplasm, temporal lobe
C71.3|Malignant neoplasm, parietal lobe
C71.4|Malignant neoplasm, occipital lobe
C71.5|Malignant neoplasm, cerebral ventricle
C71.6|Malignant neoplasm, cerebellum
C71.7|Malignant neoplasm, brain stem
C71.8|Malignant neoplasm, overlapping lesion of brain
C71.9|Malignant neoplasm, brain, unspecified
C72|Malignant neoplasm of spinal cord, cranial nerves and other parts of central nervous system
C72.0|Malignant neoplasm, spinal cord
C72.1|Malignant neoplasm, cauda equina
C72.2|Malignant neoplasm, olfactory nerve
C72.3|Malignant neoplasm, optic nerve
C72.4|Malignant neoplasm, acoustic nerve
C72.5|Malignant neoplasm, other and unspecified cranial nerves
C72.8|Malignant neoplasm, overlapping lesion of brain and other parts of cns
C72.9|Malignant neoplasm, central nervous system, unspecified
C73|Malignant neoplasm of thyroid gland
C74|Malignant neoplasm of adrenal gland
C74.0|Malignant neoplasm, cortex of adrenal gland
C74.1|Malignant neoplasm, medulla of adrenal gland
C74.9|Malignant neoplasm, adrenal gland, unspecified
C75|Malignant neoplasm of other endocrine glands and related structures
C75.0|Malignant neoplasm, parathyroid gland
C75.1|Malignant neoplasm, pituitary gland
C75.2|Malignant neoplasm, craniopharyngeal duct
C75.3|Malignant neoplasm, pineal gland
C75.4|Malignant neoplasm, carotid body
C75.5|Malignant neoplasm, aortic body and other paraganglia
C75.8|Malignant neoplasm, pluriglandular involvement, unspecified
C75.9|Malignant neoplasm, endocrine gland, unspecified
C76|Malignant neoplasm of other and ill-defined sites
C76.0|Malignant neoplasm, head, face and neck
C76.1|Malignant neoplasm, thorax
C76.2|Malignant neoplasm, abdomen
C76.3|Malignant neoplasm, pelvis
C76.4|Malignant neoplasm, upper limb
C76.5|Malignant neoplasm, lower limb
C76.7|Malignant neoplasm, other ill-defined sites
C76.8|Malignant neoplasm, overlapping lesion of other and ill-defined sites
C77|Secondary and unspecified malignant neoplasm of lymph nodes
C77.0|Secondary malignant neoplasm, lymph nodes of head, face and neck
C77.1|Secondary malignant neoplasm, intrathoracic lymph nodes
C77.2|Secondary malignant neoplasm, intra-abdominal lymph nodes
C77.3|Secondary malignant neoplasm, axillary and upper limb lymph nodes
C77.4|Secondary malignant neoplasm, inguinal and lower limb lymph nodes
C77.5|Secondary malignant neoplasm, intrapelvic lymph nodes
C77.8|Secondary malignant neoplasm, lymph nodes of multiple regions
C77.9|Secondary malignant neoplasm, lymph node, unspecified
C78|Secondary malignant neoplasm of respiratory and digestive organs
C78.0|Secondary malignant neoplasm of lung
C78.1|Secondary malignant neoplasm of mediastinum
C78.2|Secondary malignant neoplasm of pleura
C78.3|Secondary malignant neoplasm, other and unspecified respiratory organs
C78.4|Secondary malignant neoplasm of small intestine
C78.5|Secondary malignant neoplasm of large intestine and rectum
C78.6|Sec malignant neoplasm of retroperitoneum and peritoneum
C78.7|Secondary malignant neoplasm of liver
C78.8|Sec malignant neoplasm of other and unspec digestive organs
C79|Secondary malignant neoplasm of other and unspecified sites
C79.0|Secondary malignant neoplasm of kidney and renal pelvis
C79.1|Sec malignant neo bladder and oth and unspec urinary organ
C79.2|Secondary malignant neoplasm of skin
C79.3|Secondary malignant neoplasm of brain and cerebral meninges
C79.4|Sec malignant neo of other and unspec parts of nervous sys
C79.5|Secondary malignant neoplasm of bone and bone marrow
C79.6|Secondary malignant neoplasm of ovary
C79.7|Secondary malignant neoplasm of adrenal gland
C79.8|Secondary malignant neoplasm of other specified sites
C79.9|Secondary malignant neoplasm, unspecified site
C80|Malignant neoplasm without specification of site
C80.0|Malignant neoplasm, primary site unknown, so stated
C80.9|Malignant neoplasm, unspecified
C81|Hodgkin lymphoma
C81.0|Hodgkin's disease, Lymphocytic predominance
C81.1|Hodgkin's disease, Nodular sclerosis
C81.2|Hodgkin's disease, Mixed cellularity
C81.3|Hodgkin's disease, Lymphocytic depletion
C81.4|Lymphocyte-rich classical Hodgkin lymphoma
C81.7|Other hodgkin's disease
C81.9|Hodgkin's disease, unspecified
C82|Follicular lymphoma
C82.0|Follicular non-hodgkin's lymphoma, Small cleaved cell, follicular
C82.1|Follicular non-hodgkin's lymphoma, Mixed small cleaved and large cell, follicular
C82.2|Follicular non-hodgkin's lymphoma, Large cell, follicular
C82.3|Follicular lymphoma grade IIIa
C82.4|Follicular lymphoma grade IIIb
C82.5|Diffuse follicle centre lymphoma
C82.6|Cutaneous follicle centre lymphoma
C82.7|Other types of follicular non-hodgkin's lymphoma
C82.9|Follicular non-hodgkin's lymphoma, unspecified
C83|Non-follicular lymphoma
C83.0|Diffuse non-hodgkin's lymphoma,  Small cell (diffuse)
C83.1|Diffuse non-hodgkin's lymphoma, Small cleaved cell (diffuse)
C83.2|Diffuse non-hodgkin's lymphoma, Mixed small and large cell (diffuse)
C83.3|Diffuse non-hodgkin's lymphoma, Large cell (diffuse)
C83.4|Diffuse non-hodgkin's lymphoma, Immunoblastic (diffuse)
C83.5|Diffuse non-hodgkin's lymphoma, Lymphoblastic (diffuse)
C83.6|Diffuse non-hodgkin's lymphoma, Undifferentiated (diffuse)
C83.7|Diffuse non-hodgkin's lymphoma, Burkitt's tumour
C83.8|Other types of diffuse non-hodgkin's lymphoma
C83.9|Diffuse non-hodgkin's lymphoma, unspecified
C84|Mature T/NK-cell lymphomas
C84.0|Peripheral and cutaneous T-cell lymphoma, Mycosis fungoides
C84.1|Peripheral and cutaneous T-cell lymphoma, Sezary's disease
C84.2|Peripheral and cutaneous T-cell lymphoma, T-zone lymphoma
C84.3|Peripheral and cutaneous T-cell lymphoma, Lymphoepithelioid lymphoma
C84.4|Peripheral t-cell lymphoma
C84.5|Other and unspecified t-cell lymphomas
C84.6|Anaplastic large cell lymphoma, ALK-positive
C84.7|Anaplastic large cell lymphoma, ALK-negative
C84.8|Cutaneous T-cell lymphoma, unspecified
C84.9|Mature T/NK-cell lymphoma, unspecified
C85|Other and unspecified types of non-Hodgkin lymphoma
C85.0|Lymphosarcoma
C85.1|B-cell lymphoma, unspecified
C85.2|Mediastinal (thymic) large B-cell lymphoma
C85.7|Other specified types of non-hodgkin's lymphoma
C85.9|Non-hodgkin's lymphoma, unspecified type
C86|Other specified types of T/NK-cell lymphoma
C86.0|Extranodal NK/T-cell lymphoma, nasal type
C86.1|Hepatosplenic T-cell lymphoma
C86.2|Enteropathy-type (intestinal) T-cell lymphoma
C86.3|Subcutaneous panniculitis-like T-cell lymphoma
C86.4|Blastic NK-cell lymphoma
C86.5|Angioimmunoblastic T-cell lymphoma
C86.6|Primary cutaneous CD30-positive T-cell proliferations
C88|Malignant immunoproliferative diseases
C88.0|Waldenstram's macroglobulinaemia
C88.1|Alpha heavy chain disease
C88.2|Gamma heavy chain disease
C88.3|Immunoproliferative small intestinal disease
C88.4|Extranodal marginal zone B-cell lymphoma of mucosa-associated lymphoid tissue [MALT-lyphoma]
C88.7|Other malignant immunoproliferative diseases
C88.9|Malignant immunoproliferative diseases, unspecified
C90|Multiple myeloma and malignant plasma cell neoplasms
C90.0|Multiple myeloma
C90.1|Plasma cell leukaemia
C90.2|Plasmacytoma, extramedullary
C90.3|Solitary plasmacytoma
C91|Lymphoid leukaemia
C91.0|Acute lymphoblastic leukaemia
C91.1|Chronic lymphocytic leukaemia
C91.2|Subacute lymphocytic leukaemia
C91.3|Prolymphocytic leukaemia
C91.4|Hairy-cell leukaemia
C91.5|Adult t-cell leukaemia
C91.6|Prolymphocytic leukaemia of T-cell type
C91.7|Other lymphoid leukaemia
C91.8|Mature B-cell leukaemia Burkitt-type
C91.9|Lymphoid leukaemia, unspecified
C92|Myeloid leukaemia
C92.0|Acute myeloid leukaemia
C92.1|Chronic myeloid leukaemia
C92.2|Subacute myeloid leukaemia
C92.3|Myeloid sarcoma
C92.4|Acute promyelocytic leukaemia
C92.5|Acute myelomonocytic leukaemia
C92.6|Acute myeloid leukaemia with 11q23-abnormality
C92.7|Other myeloid leukaemia
C92.8|Acute myeloid leukaemia with multilineage dysplasia
C92.9|Myeloid leukaemia, unspecified
C93|Monocytic leukaemia
C93.0|Acute monocytic leukaemia
C93.1|Chronic monocytic leukaemia
C93.2|Subacute monocytic leukaemia
C93.3|Juvenile myelomonocytic leukaemia
C93.7|Other monocytic leukaemia
C93.9|Monocytic leukaemia, unspecified
C94|Other leukaemias of specified cell type
C94.0|Acute erythraemia and erythroleukaemia
C94.1|Chronic erythraemia
C94.2|Acute megakaryoblastic leukaemia
C94.3|Mast cell leukaemia
C94.4|Acute panmyelosis
C94.5|Acute myelofibrosis
C94.6|Myelodysplastic and myeloproliferative disease, not elsewhere classified
C94.7|Other specified leukaemias
C95|Leukaemia of unspecified cell type
C95.0|Acute leukaemia of unspecified cell type
C95.1|Chronic leukaemia of unspecified cell type
C95.2|Subacute leukaemia of unspecified cell type
C95.7|Other leukaemia of unspecified cell type
C95.9|Leukaemia, unspecified
C96|Other and unspecified malignant neoplasms of lymphoid, haematopoietic and related tissue
C96.0|Letterer-siwe disease
C96.1|Malignant histiocytosis
C96.2|Malignant mast cell tumour
C96.3|True histiocytic lymphoma
C96.4|Sarcoma of dendritic cells (accessory cells)
C96.5|Multifocal and unisystemic Langerhans-cell histiocytosis
C96.6|Unifocal Langerhans-cell histiocytosis
C96.7|Other specified malignant neoplasm lymphoid, hematopoietic & related tissue
C96.8|Histiocytic sarcoma
C96.9|Malignant neoplasm of lymphoid, haematopoietic and related tissue, unspecified
C97|Malignant neoplasms of independent (primary) multiple sites
D00|Carcinoma in situ of oral cavity, oesophagus and stomach
D00.0|Carcinoma in situ of lip, oral cavity and pharynx
D00.1|Carcinoma in situ of oesophagus
D00.2|Carcinoma in situ of stomach
D01|Carcinoma in situ of other and unspecified digestive organs
D01.0|Carcinoma in situ of colon
D01.1|Carcinoma in situ of rectosigmoid junction
D01.2|Carcinoma in situ of rectum
D01.3|Carcinoma in situ of anus and anal canal
D01.4|Carcinoma in situ of other and unspecified parts of intestine
D01.5|Carcinoma in situ of liver, gallbladder and bile ducts
D01.7|Carcinoma in situ of other specified digestive organs
D01.9|Carcinoma in situ of digestive organ, unspecified
D02|Carcinoma in situ of middle ear and respiratory system
D02.0|Carcinoma in situ of larynx
D02.1|Carcinoma in situ of trachea
D02.2|Carcinoma in situ of bronchus and lung
D02.3|Carcinoma in situ of other parts of respiratory system
D02.4|Carcinoma in situ of respiratory system, unspecified
D03|Melanoma in situ
D03.0|Melanoma in situ of lip
D03.1|Melanoma in situ of eyelid, including canthus
D03.2|Melanoma in situ of ear and external auricular canal
D03.3|Melanoma in situ of other and unspecified parts of face
D03.4|Melanoma in situ of scalp and neck
D03.5|Melanoma in situ of trunk
D03.6|Melanoma in situ of upper limb, including shoulder
D03.7|Melanoma in situ of lower limb, including hip
D03.8|Melanoma in situ of other sites
D03.9|Melanoma in situ, unspecified
D04|Carcinoma in situ of skin
D04.0|Carcinoma in situ skin of lip
D04.1|Carcinoma in situ skin of eyelid, including canthus
D04.2|Carcinoma in situ skin of ear and external auricular canal
D04.3|Carcinoma in situ skin of other and unspecified parts of face
D04.4|Carcinoma in situ skin of scalp and neck
D04.5|Carcinoma in situ skin of trunk
D04.6|Carcinoma in situ skin of upper limb, including shoulder
D04.7|Carcinoma in situ skin of lower limb, including hip
D04.8|Carcinoma in situ skin of other sites
D04.9|Carcinoma in situ skin, unspecified
D05|Carcinoma in situ of breast
D05.0|Lobular carcinoma in situ
D05.1|Intraductal carcinoma in situ
D05.7|Other carcinoma in situ of breast
D05.9|Carcinoma in situ of breast, unspecified
D06|Carcinoma in situ of cervix uteri
D06.0|Carcinoma in situ of endocervix
D06.1|Carcinoma in situ of exocervix
D06.7|Carcinoma in situ of other parts of cervix
D06.9|Carcinoma in situ of cervix, unspecified
D07|Carcinoma in situ of other and unspecified genital organs
D07.0|Carcinoma in situ of endometrium
D07.1|Carcinoma in situ of vulva
D07.2|Carcinoma in situ of vagina
D07.3|Carcinoma in situ of other and unspecified female genital organs
D07.4|Carcinoma in situ of penis
D07.5|Carcinoma in situ of prostate
D07.6|Carcinoma in situ of other and unspecified male genital organs
D09|Carcinoma in situ of other and unspecified sites
D09.0|Carcinoma in situ of bladder
D09.1|Carcinoma in situ of other and unspecified urinary organs
D09.2|Carcinoma in situ of eye
D09.3|Carcinoma in situ of thyroid and other endocrine glands
D09.7|Carcinoma in situ of other specified sites
D09.9|Carcinoma in situ, unspecified
D10|Benign neoplasm of mouth and pharynx
D10.0|Benign neoplasm, lip
D10.1|Benign neoplasm, tongue
D10.2|Benign neoplasm, floor of mouth
D10.3|Benign neoplasm, other and unspecified parts of mouth
D10.4|Benign neoplasm, tonsil
D10.5|Benign neoplasm, other parts of oropharynx
D10.6|Benign neoplasm, nasopharynx
D10.7|Benign neoplasm, hypopharynx
D10.9|Benign neoplasm, pharynx, unspecified
D11|Benign neoplasm of major salivary glands
D11.0|Benign neoplasm, parotid gland
D11.7|Benign neoplasm, other major salivary glands
D11.9|Benign neoplasm, major salivary gland, unspecified
D12|Benign neoplasm of colon, rectum, anus and anal canal
D12.0|Benign neoplasm, caecum
D12.1|Benign neoplasm, appendix
D12.2|Benign neoplasm, ascending colon
D12.3|Benign neoplasm, transverse colon
D12.4|Benign neoplasm, descending colon
D12.5|Benign neoplasm, sigmoid colon
D12.6|Benign neoplasm, colon, unspecified
D12.7|Benign neoplasm, rectosigmoid junction
D12.8|Benign neoplasm, rectum
D12.9|Benign neoplasm, anus and anal canal
D13|Benign neoplasm of other and ill-defined parts of digestive system
D13.0|Benign neoplasm, oesophagus
D13.1|Benign neoplasm, stomach
D13.2|Benign neoplasm, duodenum
D13.3|Benign neoplasm, other and unspecified parts of small intestine
D13.4|Benign neoplasm, liver
D13.5|Benign neoplasm, extrahepatic bile ducts
D13.6|Benign neoplasm, pancreas
D13.7|Benign neoplasm, endocrine pancreas
D13.9|Benign neoplasm, ill-defined sites within the digestive system
D14|Benign neoplasm of middle ear and respiratory system
D14.0|Benign neoplasm, middle ear, nasal cavity and accessory sinuses
D14.1|Benign neoplasm, larynx
D14.2|Benign neoplasm, trachea
D14.3|Benign neoplasm, bronchus and lung
D14.4|Benign neoplasm, respiratory system, unspecified
D15|Benign neoplasm of other and unspecified intrathoracic organs
D15.0|Benign neoplasm, thymus
D15.1|Benign neoplasm, heart
D15.2|Benign neoplasm, mediastinum
D15.7|Benign neoplasm, other specified intrathoracic organs
D15.9|Benign neoplasm, intrathoracic organ, unspecified
D16|Benign neoplasm of bone and articular cartilage
D16.0|Benign neoplasm, scapula and long bones of upper limb
D16.1|Benign neoplasm, short bones of upper limb
D16.2|Benign neoplasm, long bones of lower limb
D16.3|Benign neoplasm, short bones of lower limb
D16.4|Benign neoplasm, bones of skull and face
D16.5|Benign neoplasm, lower jaw bone
D16.6|Benign neoplasm, vertebral column
D16.7|Benign neoplasm, ribs, sternum and clavicle
D16.8|Benign neoplasm, pelvic bones, sacrum and coccyx
D16.9|Benign neoplasm, bone and articular cartilage, unspecified
D17|Benign lipomatous neoplasm
D17.0|Benign lipomatous neopl skin/subcut tis head face & neck
D17.1|Benign lipomatous neoplasm skin and subcut tissue of trunk
D17.2|Benign lipomatous neoplasm skin and subcut tissue of limbs
D17.3|Benign lipomatous neopl skin/subcut tis other/unspec sites
D17.4|Benign lipomatous neoplasm of intrathoracic organs
D17.5|Benign lipomatous neoplasm of intra-abdominal organs
D17.6|Benign lipomatous neoplasm of spermatic cord
D17.7|Benign lipomatous neoplasm of other sites
D17.9|Benign lipomatous neoplasm, unspecified
D18|Haemangioma and lymphangioma, any site
D18.0|Haemangioma, any site
D18.1|Lymphangioma, any site
D19|Benign neoplasm of mesothelial tissue
D19.0|Benign neoplasm, mesothelial tissue of pleura
D19.1|Benign neoplasm, mesothelial tissue of peritoneum
D19.7|Benign neoplasm, mesothelial tissue of other sites
D19.9|Benign neoplasm, mesothelial tissue, unspecified
D20|Benign neoplasm of soft tissue of retroperitoneum and peritoneum
D20.0|Benign neoplasm, retroperitoneum
D20.1|Benign neoplasm, peritoneum
D21|Other benign neoplasms of connective and other soft tissue
D21.0|Benign neoplasm, connective and other soft tissue of head, face and neck
D21.1|Benign neoplasm, connective and other soft tis of upper limb, inc shoulder
D21.2|Benign neoplasm, connective and other soft tissue of lower limb, inc hip
D21.3|Benign neoplasm, connective and other soft tissue of thorax
D21.4|Benign neoplasm, connective and other soft tissue of abdomen
D21.5|Benign neoplasm, connective and other soft tissue of pelvis
D21.6|Benign neoplasm, connective and other soft tissue of trunk, unspecified
D21.9|Benign neoplasm, connective and other soft tissue, unspecified
D22|Melanocytic naevi
D22.0|Melanocytic naevi of lip
D22.1|Melanocytic naevi of eyelid, including canthus
D22.2|Melanocytic naevi of ear and external auricular canal
D22.3|Melanocytic naevi of other and unspecified parts of face
D22.4|Melanocytic naevi of scalp and neck
D22.5|Melanocytic naevi of trunk
D22.6|Melanocytic naevi of upper limb, including shoulder
D22.7|Melanocytic naevi of lower limb, including hip
D22.9|Melanocytic naevi, unspecified
D23|Other benign neoplasms of skin
D23.0|Benign neoplasm, skin of lip
D23.1|Benign neoplasm, skin of eyelid, including canthus
D23.2|Benign neoplasm, skin of ear and external auricular canal
D23.3|Benign neoplasm, skin of other and unspecified parts of face
D23.4|Benign neoplasm, skin of scalp and neck
D23.5|Benign neoplasm, skin of trunk
D23.6|Benign neoplasm, skin of upper limb, including shoulder
D23.7|Benign neoplasm, skin of lower limb, including hip
D23.9|Benign neoplasm, skin, unspecified
D24|Benign neoplasm of breast
D25|Leiomyoma of uterus
D25.0|Submucous leiomyoma of uterus
D25.1|Intramural leiomyoma of uterus
D25.2|Subserosal leiomyoma of uterus
D25.9|Leiomyoma of uterus, unspecified
D26|Other benign neoplasms of uterus
D26.0|Benign neoplasm, cervix uteri
D26.1|Benign neoplasm, corpus uteri
D26.7|Benign neoplasm, other parts of uterus
D26.9|Benign neoplasm, uterus, unspecified
D27|Benign neoplasm of ovary
D28|Benign neoplasm of other and unspecified female genital organs
D28.0|Benign neoplasm, vulva
D28.1|Benign neoplasm, vagina
D28.2|Benign neoplasm, uterine tubes and ligaments
D28.7|Benign neoplasm, other specified female genital organs
D28.9|Benign neoplasm, female genital organ, unspecified
D29|Benign neoplasm of male genital organs
D29.0|Benign neoplasm, penis
D29.1|Benign neoplasm, prostate
D29.2|Benign neoplasm, testis
D29.3|Benign neoplasm, epididymis
D29.4|Benign neoplasm, scrotum
D29.7|Benign neoplasm, other male genital organs
D29.9|Benign neoplasm, male genital organ, unspecified
D30|Benign neoplasm of urinary organs
D30.0|Benign neoplasm, kidney
D30.1|Benign neoplasm, renal pelvis
D30.2|Benign neoplasm, ureter
D30.3|Benign neoplasm, bladder
D30.4|Benign neoplasm, urethra
D30.7|Benign neoplasm, other urinary organs
D30.9|Benign neoplasm, urinary organ, unspecified
D31|Benign neoplasm of eye and adnexa
D31.0|Benign neoplasm, conjunctiva
D31.1|Benign neoplasm, cornea
D31.2|Benign neoplasm, retina
D31.3|Benign neoplasm, choroid
D31.4|Benign neoplasm, ciliary body
D31.5|Benign neoplasm, lacrimal gland and duct
D31.6|Benign neoplasm, orbit, unspecified
D31.9|Benign neoplasm, eye, unspecified
D32|Benign neoplasm of meninges
D32.0|Benign neoplasm, cerebral meninges
D32.1|Benign neoplasm, spinal meninges
D32.9|Benign neoplasm, meninges, unspecified
D33|Benign neoplasm of brain and other parts of central nervous system
D33.0|Benign neoplasm, brain, supratentorial
D33.1|Benign neoplasm, brain, infratentorial
D33.2|Benign neoplasm, brain, unspecified
D33.3|Benign neoplasm, cranial nerves
D33.4|Benign neoplasm, spinal cord
D33.7|Benign neoplasm, other specified parts of central nervous system
D33.9|Benign neoplasm, central nervous system, unspecified
D34|Benign neoplasm of thyroid gland
D35|Benign neoplasm of other and unspecified endocrine glands
D35.0|Benign neoplasm, adrenal gland
D35.1|Benign neoplasm, parathyroid gland
D35.2|Benign neoplasm, pituitary gland
D35.3|Benign neoplasm, craniopharyngeal duct
D35.4|Benign neoplasm, pineal gland
D35.5|Benign neoplasm, carotid body
D35.6|Benign neoplasm, aortic body and other paraganglia
D35.7|Benign neoplasm, other specified endocrine glands
D35.8|Benign neoplasm, pluriglandular involvement
D35.9|Benign neoplasm, endocrine gland, unspecified
D36|Benign neoplasm of other and unspecified sites
D36.0|Benign neoplasm, lymph nodes
D36.1|Benign neoplasm, peripheral nerves and autonomic nervous system
D36.7|Benign neoplasm, other specified sites
D36.9|Benign neoplasm of unspecified site
D37|Neoplasm of uncertain or unknown behaviour of oral cavity and digestive organs
D37.0|Neoplasm of uncertain or unknown behaviour of lip, oral cavity and pharynx
D37.1|Neoplasm of uncertain or unknown behaviour of stomach
D37.2|Neoplasm of uncertain or unknown behaviour of small intestine
D37.3|Neoplasm of uncertain or unknown behaviour of appendix
D37.4|Neoplasm of uncertain or unknown behaviour of colon
D37.5|Neoplasm of uncertain or unknown behaviour of rectum
D37.6|Neoplasm of uncertain or unknown behaviour of liver, gallbladder and bile ducts
D37.7|Neoplasm of uncertain or unknown behaviour of other digestive organs
D37.9|Neoplasm of uncertain or unknown behaviour of digestive organ, unspecified
D38|Neoplasm of uncertain or unknown behaviour of middle ear and respiratory and intrathoracic organs
D38.0|Neoplasm of uncertain or unknown behaviour of larynx
D38.1|Neoplasm of uncertain or unknown behaviour of trachea, bronchus and lung
D38.2|Neoplasm of uncertain or unknown behaviour of pleura
D38.3|Neoplasm of uncertain or unknown behaviour of mediastinum
D38.4|Neoplasm of uncertain or unknown behaviour of thymus
D38.5|Neoplasm of uncertain or unknown behaviour of other respiratory organs
D38.6|Neoplasm of uncertain or unknown behaviour of respiratory organ, unspecified
D39|Neoplasm of uncertain or unknown behaviour of female genital organs
D39.0|Neoplasm of uncertain or unknown behaviour of uterus
D39.1|Neoplasm of uncertain or unknown behaviour of ovary
D39.2|Neoplasm of uncertain or unknown behaviour of placenta
D39.7|Neoplasm of uncertain or unknown behaviour of other female genital organs
D39.9|Neoplasm of uncertain or unknown behaviour of female genital organ, unspecified
D40|Neoplasm of uncertain or unknown behaviour of male genital organs
D40.0|Neoplasm of uncertain or unknown behaviour of prostate
D40.1|Neoplasm of uncertain or unknown behaviour of testis
D40.7|Neoplasm of uncertain or unknown behaviour of other male genital organs
D40.9|Neoplasm of uncertain or unknown behaviour of male genital organ, unspecified
D41|Neoplasm of uncertain or unknown behaviour of urinary organs
D41.0|Neoplasm of uncertain or unknown behaviour of kidney
D41.1|Neoplasm of uncertain or unknown behaviour of renal pelvis
D41.2|Neoplasm of uncertain or unknown behaviour of ureter
D41.3|Neoplasm of uncertain or unknown behaviour of urethra
D41.4|Neoplasm of uncertain or unknown behaviour of bladder
D41.7|Neoplasm of uncertain or unknown behaviour of other urinary organs
D41.9|Neoplasm of uncertain or unknown behaviour of urinary organ, unspecified
D42|Neoplasm of uncertain or unknown behaviour of meninges
D42.0|Neoplasm of uncertain or unknown behaviour of cerebral meninges
D42.1|Neoplasm of uncertain or unknown behaviour of spinal meninges
D42.9|Neoplasm of uncertain or unknown behaviour of meninges, unspecified
D43|Neoplasm of uncertain or unknown behaviour of brain and central nervous system
D43.0|Neoplasm of uncertain or unknown behaviour of brain, supratentorial
D43.1|Neoplasm of uncertain or unknown behaviour of brain, infratentorial
D43.2|Neoplasm of uncertain or unknown behaviour of brain, unspecified
D43.3|Neoplasm of uncertain or unknown behaviour of cranial nerves
D43.4|Neoplasm of uncertain or unknown behaviour of spinal cord
D43.7|Neoplasm of uncertain or unknown behaviour of other parts of central nervous system
D43.9|Neoplasm of uncertain or unknown behaviour of central nervous system, unspecified
D44|Neoplasm of uncertain or unknown behaviour of endocrine glands
D44.0|Neoplasm of uncertain or unknown behaviour of thyroid gland
D44.1|Neoplasm of uncertain or unknown behaviour of adrenal gland
D44.2|Neoplasm of uncertain or unknown behaviour of parathyroid gland
D44.3|Neoplasm of uncertain or unknown behaviour of pituitary gland
D44.4|Neoplasm of uncertain or unknown behaviour of craniopharyngeal duct
D44.5|Neoplasm of uncertain or unknown behaviour of pineal gland
D44.6|Neoplasm of uncertain or unknown behaviour of carotid body
D44.7|Neoplasm of uncertain or unknown behaviour of aortic body and other paraganglia
D44.8|Neoplasm of uncertain or unknown behaviour of pluriglandular involvement
D44.9|Neoplasm of uncertain or unknown behaviour of endocrine gland, unspecified
D45|Polycythaemia vera
D46|Myelodysplastic syndromes
D46.0|Refractory anaemia without sideroblasts, so stated
D46.1|Refractory anaemia with sideroblasts
D46.2|Refractory anaemia with excess of blasts
D46.3|Refractory anaemia with excess of blasts with transformation
D46.4|Refractory anaemia, unspecified
D46.5|Refractory anaemia with multi-lineage dysplasia
D46.6|Myelodysplastic syndrome with isolated del(5q) chromosomal abnormality
D46.7|Other myelodysplastic syndromes
D46.9|Myelodysplastic syndrome, unspecified
D47|Other neoplasms of uncertain or unknown behaviour of lymphoid, haematopoietic and related tissue
D47.0|Histiocytic and mast cell tumours uncertain and unknown behaviour
D47.1|Chronic myeloproliferative disease
D47.2|Monoclonal gammopathy
D47.3|Essential (haemorrhagic) thrombocythaemia
D47.4|Osteomyelofibrosis
D47.5|Chronic eosinophilic leukaemia [hypereosinophilic syndrome]
D47.7|Other specified neoplasms of uncertain or unknown behaviour of lymphoid, haematopoietic and related tissue
D47.9|Neoplasms of uncertain or unknown behaviour of lymphoid, haematopoietic and related tissue, unspecified
D48|Neoplasm of uncertain or unknown behaviour of other and unspecified sites
D48.0|Neoplasms of uncertain or unknown behaviour of bone and articular cartilage
D48.1|Neoplasms of uncertain or unknown behaviour of connective and other soft tissue
D48.2|Neoplasms of uncertain or unknown behaviour of peripheral nerves and autonomic nervous system
D48.3|Neoplasms of uncertain or unknown behaviour of retroperitoneum
D48.4|Neoplasms of uncertain or unknown behaviour of peritoneum
D48.5|Neoplasms of uncertain or unknown behaviour of skin
D48.6|Neoplasms of uncertain or unknown behaviour of breast
D48.7|Neoplasms of uncertain or unknown behaviour of other specified sites
D48.9|Neoplasm of uncertain or unknown behaviour, unspecified
D50|Iron deficiency anaemia
D50.0|Iron deficiency anaemia secondary to blood loss (chronic)
D50.1|Sideropenic dysphagia
D50.8|Other iron deficiency anaemias
D50.9|Iron deficiency anaemia, unspecified
D51|Vitamin B12 deficiency anaemia
D51.0|Vitamin b12 defic anaemia due to intrinsic factor deficiency
D51.1|Vit b12 def anaem select vit b12 malabsorp with proteinuria
D51.2|Transcobalamin ii deficiency
D51.3|Other dietary vitamin b12 deficiency anaemia
D51.8|Other vitamin b12 deficiency anaemias
D51.9|Vitamin b12 deficiency anaemia, unspecified
D52|Folate deficiency anaemia
D52.0|Dietary folate deficiency anaemia
D52.1|Drug-induced folate deficiency anaemia
D52.8|Other folate deficiency anaemias
D52.9|Folate deficiency anaemia, unspecified
D53|Other nutritional anaemias
D53.0|Protein deficiency anaemia
D53.1|Other megaloblastic anaemias, not elsewhere classified
D53.2|Scorbutic anaemia
D53.8|Other specified nutritional anaemias
D53.9|Nutritional anaemia, unspecified
D55|Anaemia due to enzyme disorders
D55.0|Anaemia due to glucose-6-phosphate dehydrogenase deficiency
D55.1|Anaemia due to other disorders of glutathione metabolism
D55.2|Anaemia due to disorders of glycolytic enzymes
D55.3|Anaemia due to disorders of nucleotide metabolism
D55.8|Other anaemias due to enzyme disorders
D55.9|Anaemia due to enzyme disorder, unspecified
D56|Thalassaemia
D56.0|Alpha thalassaemia
D56.1|Beta thalassaemia
D56.2|Delta-beta thalassaemia
D56.3|Thalassaemia trait
D56.4|Hereditary persistence of fetal haemoglobin [hpfh]
D56.8|Other thalassaemias
D56.9|Thalassaemia, unspecified
D57|Sickle-cell disorders
D57.0|Sickle-cell anaemia with crisis
D57.1|Sickle-cell anaemia without crisis
D57.2|Double heterozygous sickling disorders
D57.3|Sickle-cell trait
D57.8|Other sickle-cell disorders
D58|Other hereditary haemolytic anaemias
D58.0|Hereditary spherocytosis
D58.1|Hereditary elliptocytosis
D58.2|Other haemoglobinopathies
D58.8|Other specified hereditary haemolytic anaemias
D58.9|Hereditary haemolytic anaemia, unspecified
D59|Acquired haemolytic anaemia
D59.0|Drug-induced autoimmune haemolytic anaemia
D59.1|Other autoimmune haemolytic anaemias
D59.2|Drug-induced nonautoimmune haemolytic anaemia
D59.3|Haemolytic-uraemic syndrome
D59.4|Other nonautoimmune haemolytic anaemias
D59.5|Paroxysmal nocturnal haemoglobinuria [marchiafava-micheli]
D59.6|Haemoglobinuria due to haemolysis from other external causes
D59.8|Other acquired haemolytic anaemias
D59.9|Acquired haemolytic anaemia, unspecified
D60|Acquired pure red cell aplasia [erythroblastopenia]
D60.0|Chronic acquired pure red cell aplasia
D60.1|Transient acquired pure red cell aplasia
D60.8|Other acquired pure red cell aplasias
D60.9|Acquired pure red cell aplasia, unspecified
D61|Other aplastic anaemias
D61.0|Constitutional aplastic anaemia
D61.1|Drug-induced aplastic anaemia
D61.2|Aplastic anaemia due to other external agents
D61.3|Idiopathic aplastic anaemia
D61.8|Other specified aplastic anaemias
D61.9|Aplastic anaemia, unspecified
D62|Acute posthaemorrhagic anaemia
D63|Anaemia in chronic diseases classified elsewhere
D63.0|Anaemia in neoplastic disease
D63.8|Anaemia in other chronic diseases classified elsewhere
D64|Other anaemias
D64.0|Hereditary sideroblastic anaemia
D64.1|Secondary sideroblastic anaemia due to disease
D64.2|Secondary sideroblastic anaemia due to drugs and toxins
D64.3|Other sideroblastic anaemias
D64.4|Congenital dyserythropoietic anaemia
D64.8|Other specified anaemias
D64.9|Anaemia, unspecified
D65|Dissem intravascular coagulation [defibrination syndrome]
D66|Hereditary factor viii deficiency
D67|Hereditary factor ix deficiency
D68|Other coagulation defects
D68.0|Von willebrand's disease
D68.1|Hereditary factor xi deficiency
D68.2|Hereditary deficiency of other clotting factors
D68.3|Haemorrhagic disorder due to circulating anticoagulants
D68.4|Acquired coagulation factor deficiency
D68.5|Primary Thrombophilia
D68.6|Other Thrombophilia
D68.8|Other specified coagulation defects
D68.9|Coagulation defect, unspecified
D69|Purpura and other haemorrhagic conditions
D69.0|Allergic purpura
D69.1|Qualitative platelet defects
D69.2|Other nonthrombocytopenic purpura
D69.3|Idiopathic thrombocytopenic purpura
D69.4|Other primary thrombocytopenia
D69.5|Secondary thrombocytopenia
D69.6|Thrombocytopenia, unspecified
D69.8|Other specified haemorrhagic conditions
D69.9|Haemorrhagic condition, unspecified
D70|Agranulocytosis
D71|Functional disorders of polymorphonuclear neutrophils
D72|Other disorders of white blood cells
D72.0|Genetic anomalies of leukocytes
D72.1|Eosinophilia
D72.8|Other specified disorders of white blood cells
D72.9|Disorder of white blood cells, unspecified
D73|Diseases of spleen
D73.0|Hyposplenism
D73.1|Hypersplenism
D73.2|Chronic congestive splenomegaly
D73.3|Abscess of spleen
D73.4|Cyst of spleen
D73.5|Infarction of spleen
D73.8|Other diseases of spleen
D73.9|Disease of spleen, unspecified
D74|Methaemoglobinaemia
D74.0|Congenital methaemoglobinaemia
D74.8|Other methaemoglobinaemias
D74.9|Methaemoglobinaemia, unspecified
D75|Other diseases of blood and blood-forming organs
D75.0|Familial erythrocytosis
D75.1|Secondary polycythaemia
D75.2|Essential thrombocytosis
D75.8|Other specified diseases of blood and blood-forming organs
D75.9|Disease of blood and blood-forming organs, unspecified
D76|Other specified diseases with participation of lymphoreticular and reticulohistiocytic tissue
D76.0|Langerhans' cell histiocytosis, not elsewhere classified
D76.1|Haemophagocytic lymphohistiocytosis
D76.2|Haemophagocytic syndrome, infection-associated
D76.3|Other histiocytosis syndromes
D77|Other disorders of blood and blood-forming organs in dis ce
D80|Immunodeficiency with predominantly antibody defects
D80.0|Hereditary hypogammaglobulinaemia
D80.1|Nonfamilial hypogammaglobulinaemia
D80.2|Selective deficiency of immunoglobulin a [iga]
D80.3|Selective deficiency of immunoglobulin g [igg] subclasses
D80.4|Selective deficiency of immunoglobulin m [igm]
D80.5|Immunodeficiency with increased immunoglobulin m [igm]
D80.6|Antibod def with near-norm imunoglob/hyperimmunoglobulinaemia
D80.7|Transient hypogammaglobulinaemia of infancy
D80.8|Other immunodeficiencies with predominantly antibody defects
D80.9|Immunodeficiency with predominantly antibody defects, unspec act
D81|Combined immunodeficiencies
D81.0|Severe combined immunodeficiency with reticular dysgenesis
D81.1|Severe combined immunodef with low t- and b-cell numbers
D81.2|Severe combined immunodef with low or normal b-cell numbers
D81.3|Adenosine deaminase [ada] deficiency
D81.4|Nezelof's syndrome
D81.5|Purine nucleoside phosphorylase [pnp] deficiency
D81.6|Major histocompatibility complex class i deficiency
D81.7|Major histocompatibility complex class ii deficiency
D81.8|Other combined immunodeficiencies
D81.9|Combined immunodeficiency, unspecified
D82|Immunodeficiency associated with other major defects
D82.0|Wiskott-aldrich syndrome
D82.1|Di george's syndrome
D82.2|Immunodeficiency with short-limbed stature
D82.3|Immunodef follow hereditary defect respon epstein-barr virus
D82.4|Hyperimmunoglobulin e [ige] syndrome
D82.8|Immunodeficiency assoc with other specified major defects
D82.9|Immunodeficiency associated with major defect, unspecified
D83|Common variable immunodeficiency
D83.0|Com var immunodef with predom abn b-cell numb and function
D83.1|Common var immunodef predom immunoregulatory t-cell disorder
D83.2|Common variable immunodef autoantibodies to b- or t-cells
D83.8|Other common variable immunodeficiencies
D83.9|Common variable immunodeficiency, unspecified
D84|Other immunodeficiencies
D84.0|Lymphocyte function antigen-1 [lfa-1] defect
D84.1|Defects in the complement system
D84.8|Other specified immunodeficiencies
D84.9|Immunodeficiency, unspecified
D86|Sarcoidosis
D86.0|Sarcoidosis of lung
D86.1|Sarcoidosis of lymph nodes
D86.2|Sarcoidosis of lung with sarcoidosis of lymph nodes
D86.3|Sarcoidosis of skin
D86.8|Sarcoidosis of other and combined sites
D86.9|Sarcoidosis, unspecified
D89|Other disorders involving the immune mechanism, not elsewhere classified
D89.0|Polyclonal hypergammaglobulinaemia
D89.1|Cryoglobulinaemia
D89.2|Hypergammaglobulinaemia, unspecified
D89.3|Immune reconstitution syndrome
D89.8|Oth specified disorders involving the immune mechanism nec
D89.9|Disorder involving the immune mechanism, unspecified
E00|Congenital iodine-deficiency syndrome
E00.0|Congenital iodine-deficiency syndrome, neurological type
E00.1|Congenital iodine-deficiency syndrome, myxoedematous type
E00.2|Congenital iodine-deficiency syndrome, mixed type
E00.9|Congenital iodine-deficiency syndrome, unspecified
E01|Iodine-deficiency-related thyroid disorders and allied conditions
E01.0|Iodine-deficiency-related diffuse (endemic) goitre
E01.1|Iodine-deficiency-related multinodular (endemic) goitre
E01.2|Iodine-deficiency-related (endemic) goitre, unspecified
E01.8|Other iodine-def-related thyroid disorders and allied conds
E02|Subclinical iodine-deficiency hypothyroidism
E03|Other hypothyroidism
E03.0|Congenital hypothyroidism with diffuse goitre
E03.1|Congenital hypothyroidism without goitre
E03.2|Hypothyroidism due medicaments and oth exogenous substances
E03.3|Postinfectious hypothyroidism
E03.4|Atrophy of thyroid (acquired)
E03.5|Myxoedema coma
E03.8|Other specified hypothyroidism
E03.9|Hypothyroidism, unspecified
E04|Other nontoxic goitre
E04.0|Nontoxic diffuse goitre
E04.1|Nontoxic single thyroid nodule
E04.2|Nontoxic multinodular goitre
E04.8|Other specified nontoxic goitre
E04.9|Nontoxic goitre, unspecified
E05|Thyrotoxicosis [hyperthyroidism]
E05.0|Thyrotoxicosis with diffuse goitre
E05.1|Thyrotoxicosis with toxic single thyroid nodule
E05.2|Thyrotoxicosis with toxic multinodular goitre
E05.3|Thyrotoxicosis from ectopic thyroid tissue
E05.4|Thyrotoxicosis factitia
E05.5|Thyroid crisis or storm
E05.8|Other thyrotoxicosis
E05.9|Thyrotoxicosis, unspecified
E06|Thyroiditis
E06.0|Acute thyroiditis
E06.1|Subacute thyroiditis
E06.2|Chronic thyroiditis with transient thyrotoxicosis
E06.3|Autoimmune thyroiditis
E06.4|Drug-induced thyroiditis
E06.5|Other chronic thyroiditis
E06.9|Thyroiditis, unspecified
E07|Other disorders of thyroid
E07.0|Hypersecretion of calcitonin
E07.1|Dyshormogenetic goitre
E07.8|Other specified disorders of thyroid
E07.9|Disorder of thyroid, unspecified
E10|Insulin-dependent diabetes mellitus
E10.0|Insulin-dependent diabetes mellitus with coma
E10.1|Insulin-dependent diabetes mellitus with ketoacidosis
E10.2|Insulin-dependent diabetes mellitus with renal complications
E10.3|Insulin-dependent diabetes mellitus with ophthalmic complications
E10.4|Insulin-dependent diabetes mellitus with neurological complications
E10.5|Insulin-dependent diabetes mellitus with peripheral circulatory complications
E10.6|Insulin-dependent diabetes mellitus with other specified complications
E10.7|Insulin-dependent diabetes mellitus with multiple complications
E10.8|Insulin-dependent diabetes mellitus with unspecified complications
E10.9|Insulin-dependent diabetes mellitus without complications
E11|Non-insulin-dependent diabetes mellitus
E11.0|Non-insulin-dependent diabetes mellitus with coma
E11.1|Non-insulin-dependent diabetes mellitus with ketoacidosis
E11.2|Non-insulin-dependent diabetes mellitus with renal complications
E11.3|Non-insulin-dependent diabetes mellitus with ophthalmic complications
E11.4|Non-insulin-dependent diabetes mellitus with neurological complications
E11.5|Non-insulin-dependent diabetes mellitus with peripheral circulatory complications
E11.6|Non-insulin-dependent diabetes mellitus with other specified complications
E11.7|Non-insulin-dependent diabetes mellitus with multiple complications
E11.8|Non-insulin-dependent diabetes mellitus with unspecified complications
E11.9|Non-insulin-dependent diabetes mellitus without complications
E12|Malnutrition-related diabetes mellitus
E12.0|Malnutrition-related diabetes mellitus with coma
E12.1|Malnutrition-related diabetes mellitus with ketoacidosis
E12.2|Malnutrition-related diabetes mellitus with renal complications
E12.3|Malnutrition-related diabetes mellitus with ophthalmic complications
E12.4|Malnutrition-related diabetes mellitus with neurological complications
E12.5|Malnutrition-related diabetes mellitus with peripheral circulatory complications
E12.6|Malnutrition-related diabetes mellitus with other specified complications
E12.7|Malnutrition-related diabetes mellitus with multiple complications
E12.8|Malnutrition-related diabetes mellitus with unspecified complications
E12.9|Malnutrition-related diabetes mellitus without complications
E13|Other specified diabetes mellitus
E13.0|Other specified diabetes mellitus with coma
E13.1|Other specified diabetes mellitus with ketoacidosis
E13.2|Other specified diabetes mellitus with renal complications
E13.3|Other specified diabetes mellitus with ophthalmic complications
E13.4|Other specified diabetes mellitus with neurological complications
E13.5|Other specified diabetes mellitus with peripheral circulatory complications
E13.6|Other specified diabetes mellitus with other specified complications
E13.7|Other specified diabetes mellitus with multiple complications
E13.8|Other specified diabetes mellitus with unspecified complications
E13.9|Other specified diabetes mellitus without complications
E14|Unspecified diabetes mellitus
E14.0|Unspecified diabetes mellitus with coma
E14.1|Unspecified diabetes mellitus with ketoacidosis
E14.2|Unspecified diabetes mellitus with renal complications
E14.3|Unspecified diabetes mellitus with ophthalmic complications
E14.4|Unspecified diabetes mellitus with neurological complications
E14.5|Unspecified diabetes mellitus with peripheral circulatory complications
E14.6|Unspecified diabetes mellitus with other specified complications
E14.7|Unspecified diabetes mellitus with multiple complications
E14.8|Unspecified diabetes mellitus with unspecified complications
E14.9|Unspecified diabetes mellitus without complications
E15|Nondiabetic hypoglycaemic coma
E16|Other disorders of pancreatic internal secretion
E16.0|Drug-induced hypoglycaemia without coma
E16.1|Other hypoglycaemia
E16.2|Hypoglycaemia, unspecified
E16.3|Increased secretion of glucagon
E16.4|Abnormal secretion of gastrin
E16.8|Other specified disorders of pancreatic internal secretion
E16.9|Disorder of pancreatic internal secretion, unspecified
E20|Hypoparathyroidism
E20.0|Idiopathic hypoparathyroidism
E20.1|Pseudohypoparathyroidism
E20.8|Other hypoparathyroidism
E20.9|Hypoparathyroidism, unspecified
E21|Hyperparathyroidism and other disorders of parathyroid gland
E21.0|Primary hyperparathyroidism
E21.1|Secondary hyperparathyroidism, not elsewhere classified
E21.2|Other hyperparathyroidism
E21.3|Hyperparathyroidism, unspecified
E21.4|Other specified disorders of parathyroid gland
E21.5|Disorder of parathyroid gland, unspecified
E22|Hyperfunction of pituitary gland
E22.0|Acromegaly and pituitary gigantism
E22.1|Hyperprolactinaemia
E22.2|Syndrome of inappropriate secretion of antidiuretic hormone
E22.8|Other hyperfunction of pituitary gland
E22.9|Hyperfunction of pituitary gland, unspecified
E23|Hypofunction and other disorders of pituitary gland
E23.0|Hypopituitarism
E23.1|Drug-induced hypopituitarism
E23.2|Diabetes insipidus
E23.3|Hypothalamic dysfunction, not elsewhere classified
E23.6|Other disorders of pituitary gland
E23.7|Disorder of pituitary gland, unspecified
E24|Cushing syndrome
E24.0|Pituitary-dependent cushing's disease
E24.1|Nelson's syndrome
E24.2|Drug-induced cushing's syndrome
E24.3|Ectopic acth syndrome
E24.4|Alcohol-induced pseudo-cushing's syndrome
E24.8|Other cushing's syndrome
E24.9|Cushing's syndrome, unspecified
E25|Adrenogenital disorders
E25.0|Congenital adrenogenital disorders associated enzyme def
E25.8|Other adrenogenital disorders
E25.9|Adrenogenital disorder, unspecified
E26|Hyperaldosteronism
E26.0|Primary hyperaldosteronism
E26.1|Secondary hyperaldosteronism
E26.8|Other hyperaldosteronism
E26.9|Hyperaldosteronism, unspecified
E27|Other disorders of adrenal gland
E27.0|Other adrenocortical overactivity
E27.1|Primary adrenocortical insufficiency
E27.2|Addisonian crisis
E27.3|Drug-induced adrenocortical insufficiency
E27.4|Other and unspecified adrenocortical insufficiency
E27.5|Adrenomedullary hyperfunction
E27.8|Other specified disorders of adrenal gland
E27.9|Disorder of adrenal gland, unspecified
E28|Ovarian dysfunction
E28.0|Estrogen excess
E28.1|Androgen excess
E28.2|Polycystic ovarian syndrome
E28.3|Primary ovarian failure
E28.8|Other ovarian dysfunction
E28.9|Ovarian dysfunction, unspecified
E29|Testicular dysfunction
E29.0|Testicular hyperfunction
E29.1|Testicular hypofunction
E29.8|Other testicular dysfunction
E29.9|Testicular dysfunction, unspecified
E30|Disorders of puberty, not elsewhere classified
E30.0|Delayed puberty
E30.1|Precocious puberty
E30.8|Other disorders of puberty
E30.9|Disorder of puberty, unspecified
E31|Polyglandular dysfunction
E31.0|Autoimmune polyglandular failure
E31.1|Polyglandular hyperfunction
E31.8|Other polyglandular dysfunction
E31.9|Polyglandular dysfunction, unspecified
E32|Diseases of thymus
E32.0|Persistent hyperplasia of thymus
E32.1|Abscess of thymus
E32.8|Other diseases of thymus
E32.9|Disease of thymus, unspecified
E34|Other endocrine disorders
E34.0|Carcinoid syndrome
E34.1|Other hypersecretion of intestinal hormones
E34.2|Ectopic hormone secretion, not elsewhere classified
E34.3|Short stature, not elsewhere classified
E34.4|Constitutional tall stature
E34.5|Androgen resistance syndrome
E34.8|Other specified endocrine disorders
E34.9|Endocrine disorder, unspecified
E35|Disorders of endocrine glands in diseases classified elsewhere
E35.0|Disorders of thyroid gland in diseases classified elsewhere
E35.1|Disorders of adrenal glands in diseases classified elsewhere
E35.8|Disorders other endocrine glands in disease class elsewhere
E40|Kwashiorkor
E41|Nutritional marasmus
E42|Marasmic kwashiorkor
E43|Unspecified severe protein-energy malnutrition
E44|Protein-energy malnutrition of moderate and mild degree
E44.0|Moderate protein-energy malnutrition
E44.1|Mild protein-energy malnutrition
E45|Retarded development following protein-energy malnutrition
E46|Unspecified protein-energy malnutrition
E50|Vitamin A deficiency
E50.0|Vitamin A deficiency with conjunctival xerosis
E50.1|Vitamin A deficiency with bitot's spot and conjunctival xerosis
E50.2|Vitamin A deficiency with corneal xerosis
E50.3|Vitamin A deficiency with corneal ulceration and xerosis
E50.4|Vitamin A deficiency with keratomalacia
E50.5|Vitamin A deficiency with night blindness
E50.6|Vitamin A deficiency with xerophthalmic scars of cornea
E50.7|Other ocular manifestations of vitamin A deficiency
E50.8|Other manifestations of vitamin A deficiency
E50.9|Vitamin A deficiency, unspecified
E51|Thiamine deficiency
E51.1|Beriberi
E51.2|Wernicke's encephalopathy
E51.8|Other manifestations of thiamine deficiency
E51.9|Thiamine deficiency, unspecified
E52|Niacin deficiency [pellagra]
E53|Deficiency of other B group vitamins
E53.0|Riboflavin deficiency
E53.1|Pyridoxine deficiency
E53.8|Deficiency of other specified B group vitamins
E53.9|Vitamin B deficiency, unspecified
E54|Ascorbic acid deficiency
E55|Vitamin D deficiency
E55.0|Rickets, active
E55.9|Vitamin D deficiency, unspecified
E56|Other vitamin deficiencies
E56.0|Deficiency of vitamin E
E56.1|Deficiency of vitamin K
E56.8|Deficiency of other vitamins
E56.9|Vitamin deficiency, unspecified
E58|Dietary calcium deficiency
E59|Dietary selenium deficiency
E60|Dietary zinc deficiency
E61|Deficiency of other nutrient elements
E61.0|Copper deficiency
E61.1|Iron deficiency
E61.2|Magnesium deficiency
E61.3|Manganese deficiency
E61.4|Chromium deficiency
E61.5|Molybdenum deficiency
E61.6|Vanadium deficiency
E61.7|Deficiency of multiple nutrient elements
E61.8|Deficiency of other specified nutrient elements
E61.9|Deficiency of nutrient element, unspecified
E63|Other nutritional deficiencies
E63.0|Essential fatty acid [efa] deficiency
E63.1|Imbalance of constituents of food intake
E63.8|Other specified nutritional deficiencies
E63.9|Nutritional deficiency, unspecified
E64|Sequelae of malnutrition and other nutritional deficiencies
E64.0|Sequelae of protein-energy malnutrition
E64.1|Sequelae of vitamin A deficiency
E64.2|Sequelae of vitamin C deficiency
E64.3|Sequelae of rickets
E64.8|Sequelae of other nutritional deficiencies
E64.9|Sequelae of unspecified nutritional deficiency
E65|Localized adiposity
E66|Obesity
E66.0|Obesity due to excess calories
E66.1|Drug-induced obesity
E66.2|Extreme obesity with alveolar hypoventilation
E66.8|Other obesity
E66.9|Obesity, unspecified
E67|Other hyperalimentation
E67.0|Hypervitaminosis A
E67.1|Hypercarotenaemia
E67.2|Megavitamin-B6 syndrome
E67.3|Hypervitaminosis D
E67.8|Other specified hyperalimentation
E68|Sequelae of hyperalimentation
E70|Disorders of aromatic amino-acid metabolism
E70.0|Classical phenylketonuria
E70.1|Other hyperphenylalaninaemias
E70.2|Disorders of tyrosine metabolism
E70.3|Albinism
E70.8|Other disorders of aromatic amino-acid metabolism
E70.9|Disorder of aromatic amino-acid metabolism, unspecified
E71|Disorders of branched-chain amino-acid metabolism and fatty-acid metabolism
E71.0|Maple-syrup-urine disease
E71.1|Other disorders of branched-chain amino-acid metabolism
E71.2|Disorder of branched-chain amino-acid metabolism, unspec act
E71.3|Disorders of fatty-acid metabolism
E72|Other disorders of amino-acid metabolism
E72.0|Disorders of amino-acid transport
E72.1|Disorders of sulfur-bearing amino-acid metabolism
E72.2|Disorders of urea cycle metabolism
E72.3|Disorders of lysine and hydroxylysine metabolism
E72.4|Disorders of ornithine metabolism
E72.5|Disorders of glycine metabolism
E72.8|Other specified disorders of amino-acid metabolism
E72.9|Disorder of amino-acid metabolism, unspecified
E73|Lactose intolerance
E73.0|Congenital lactase deficiency
E73.1|Secondary lactase deficiency
E73.8|Other lactose intolerance
E73.9|Lactose intolerance, unspecified
E74|Other disorders of carbohydrate metabolism
E74.0|Glycogen storage disease
E74.1|Disorders of fructose metabolism
E74.2|Disorders of galactose metabolism
E74.3|Other disorders of intestinal carbohydrate absorption
E74.4|Disorders of pyruvate metabolism and gluconeogenesis
E74.8|Other specified disorders of carbohydrate metabolism
E74.9|Disorder of carbohydrate metabolism, unspecified
E75|Disorders of sphingolipid metabolism and other lipid storage disorders
E75.0|Gm2 gangliosidosis
E75.1|Other gangliosidosis
E75.2|Other sphingolipidosis
E75.3|Sphingolipidosis, unspecified
E75.4|Neuronal ceroid lipofuscinosis
E75.5|Other lipid storage disorders
E75.6|Lipid storage disorder, unspecified
E76|Disorders of glycosaminoglycan metabolism
E76.0|Mucopolysaccharidosis, type i
E76.1|Mucopolysaccharidosis, type ii
E76.2|Other mucopolysaccharidoses
E76.3|Mucopolysaccharidosis, unspecified
E76.8|Other disorders of glucosaminoglycan metabolism
E76.9|Disorder of glucosaminoglycan metabolism, unspecified
E77|Disorders of glycoprotein metabolism
E77.0|Defects in post-translational modif'n of lysosomal enzymes
E77.1|Defects in glycoprotein degradation
E77.8|Other disorders of glycoprotein metabolism
E77.9|Disorder of glycoprotein metabolism, unspecified
E78|Disorders of lipoprotein metabolism and other lipidaemias
E78.0|Pure hypercholesterolaemia
E78.1|Pure hyperglyceridaemia
E78.2|Mixed hyperlipidaemia
E78.3|Hyperchylomicronaemia
E78.4|Other hyperlipidaemia
E78.5|Hyperlipidaemia, unspecified
E78.6|Lipoprotein deficiency
E78.8|Other disorders of lipoprotein metabolism
E78.9|Disorder of lipoprotein metabolism, unspecified
E79|Disorders of purine and pyrimidine metabolism
E79.0|Hyperuricaem without sign  inflamm arthritis+tophaceous dis
E79.1|Lesch-Nyhan syndrome
E79.8|Other disorders of purine and pyrimidine metabolism
E79.9|Disorder of purine and pyrimidine metabolism, unspecified
E80|Disorders of porphyrin and bilirubin metabolism
E80.0|Hereditary erythropoietic porphyria
E80.1|Porphyria cutanea tarda
E80.2|Other porphyria
E80.3|Defects of catalase and peroxidase
E80.4|Gilbert's syndrome
E80.5|Crigler-najjar syndrome
E80.6|Other disorders of bilirubin metabolism
E80.7|Disorder of bilirubin metabolism, unspecified
E83|Disorders of mineral metabolism
E83.0|Disorders of copper metabolism
E83.1|Disorders of iron metabolism
E83.2|Disorders of zinc metabolism
E83.3|Disorders of phosphorus metabolism
E83.4|Disorders of magnesium metabolism
E83.5|Disorders of calcium metabolism
E83.8|Other disorders of mineral metabolism
E83.9|Disorder of mineral metabolism, unspecified
E84|Cystic fibrosis
E84.0|Cystic fibrosis with pulmonary manifestations
E84.1|Cystic fibrosis with intestinal manifestations
E84.8|Cystic fibrosis with other manifestations
E84.9|Cystic fibrosis, unspecified
E85|Amyloidosis
E85.0|Non-neuropathic heredofamilial amyloidosis
E85.1|Neuropathic heredofamilial amyloidosis
E85.2|Heredofamilial amyloidosis, unspecified
E85.3|Secondary systemic amyloidosis
E85.4|Organ-limited amyloidosis
E85.8|Other amyloidosis
E85.9|Amyloidosis, unspecified
E86|Volume depletion
E87|Other disorders of fluid, electrolyte and acid-base balance
E87.0|Hyperosmolality and hypernatraemia
E87.1|Hypo-osmolality and hyponatraemia
E87.2|Acidosis
E87.3|Alkalosis
E87.4|Mixed disorder of acid-base balance
E87.5|Hyperkalaemia
E87.6|Hypokalaemia
E87.7|Fluid overload
E87.8|Other disorders of electrolyte and fluid balance NEC
E88|Other metabolic disorders
E88.0|Disorders of plasma-protein metabolism NEC
E88.1|Lipodystrophy, not elsewhere classified
E88.2|Lipomatosis, not elsewhere classified
E88.3|Tumour lysis syndrome
E88.8|Other specified metabolic disorders
E88.9|Metabolic disorder, unspecified
E89|Postprocedural endocrine and metabolic disorders, not elsewhere classified
E89.0|Postprocedural hypothyroidism
E89.1|Postprocedural hypoinsulinaemia
E89.2|Postprocedural hypoparathyroidism
E89.3|Postprocedural hypopituitarism
E89.4|Postprocedural ovarian failure
E89.5|Postprocedural testicular hypofunction
E89.6|Postprocedural adrenocortical(-medullary) hypofunction
E89.8|Other postprocedural endocrine and metabolic disorders
E89.9|Postprocedural endocrine and metabolic disorder, unspecified
E90|Nutritional and metabolic disorders in diseases
F00|Dementia in Alzheimer disease
F00.0|Dementia in alzheimer's disease with early onset
F00.1|Dementia in alzheimer's disease with late onset
F00.2|Dementia in alzheimer's disease, atypical or mixed type
F00.9|Dementia in alzheimer's disease, unspecified
F01|Vascular dementia
F01.0|Vascular dementia of acute onset
F01.1|Multi-infarct dementia
F01.2|Subcortical vascular dementia
F01.3|Mixed cortical and subcortical vascular dementia
F01.8|Other vascular dementia
F01.9|Vascular dementia, unspecified
F02|Dementia in other diseases classified elsewhere
F02.0|Dementia in Pick's disease
F02.1|Dementia in Creutzfeldt-Jakob disease
F02.2|Dementia in Huntington's disease
F02.3|Dementia in Parkinson's disease
F02.4|Dementia in human immunodef virus [HIV] disease
F02.8|Dementia in other specified diseases classified elsewhere
F03|Unspecified dementia
F04|Organic amnesic syndrome not induced alcohol/other psychoactive substances
F05|Delirium, not induced by alcohol and other psychoactive substances
F05.0|Delirium not superimposed on dementia, so described
F05.1|Delirium superimposed on dementia
F05.8|Other delirium
F05.9|Delirium, unspecified
F06|Other mental disorders due to brain damage and dysfunction and to physical disease
F06.0|Organic hallucinosis
F06.1|Organic catatonic disorder
F06.2|Organic delusional [schizophrenia-like] disorder
F06.3|Organic mood [affective] disorders
F06.4|Organic anxiety disorder
F06.5|Organic dissociative disorder
F06.6|Organic emotionally labile [asthenic] disorder
F06.7|Mild cognitive disorder
F06.8|Other specified mental disorder brain damage and dysfunction/physcal disease
F06.9|Unspecified mental disorder brain damage and dysfunction/physcal disease
F07|Personality and behavioural disorders due to brain disease, damage and dysfunction
F07.0|Organic personality disorder
F07.1|Postencephalitic syndrome
F07.2|Postconcussional syndrome
F07.8|Other organ personality  behavioural disorders due to brain disease, damage dysfunction
F07.9|Unspecified organ personality behavioural disorder brain damage and  dysfunction
F09|Unspecified organic or symptomatic mental disorder
F10|Mental and behavioural disorders due to use of alcohol
F10.0|Mental & behavioural disorder due to use of alcohol: acute intoxication
F10.1|Mental & behavioural disorder due to use of alcohol: harmful use
F10.2|Mental & behavioural disorder due to use of alcohol: dependence syndrome
F10.3|Mental & behavioural disorder due to use of alcohol: withdrawal state
F10.4|Mental & behavioural disorder due to use of alcohol: withdrawl state with delirium
F10.5|Mental & behavioural disorder due to use of alcohol: psychotic disorder
F10.6|Mental & behavioural disorder due to use of alcohol: amnesic syndrome
F10.7|Mental & behavioural disorder due to use of alcohol: residual & late-onset psychotic disorder
F10.8|Mental & behavioural disorder due to use of alcohol: other mental & behavioural disorder
F10.9|Mental & behavioural disorder due to use of alcohol: unspecified mental & behavioural disorder
F11|Mental and behavioural disorders due to use of opioids
F11.0|Mental & behavioural disorder due to use of opiods: acute intoxication
F11.1|Mental & behavioural disorder due to use of opiods: harmful use
F11.2|Mental & behavioural disorder due to use of opiods: dependence syndrome
F11.3|Mental & behavioural disorder due to use of opiods: withdrawal state
F11.4|Mental & behavioural disorder due to use of opiods: withdrawl state with delirium
F11.5|Mental & behavioural disorder due to use of opiods: psychotic disorder
F11.6|Mental & behavioural disorder due to use of opiods: amnesic syndrome
F11.7|Mental & behavioural disorder due to use of opiods: residual & late-onset psychotic disorder
F11.8|Mental & behavioural disorder due to use of opiods: other mental & behavioural disorder
F11.9|Mental & behavioural disorder due to use of opiods: unspecified mental & behavioural disorder
F12|Mental and behavioural disorders due to use of cannabinoids
F12.0|Mental & behavioural disorder due to use of cannabinoids: acute intoxication
F12.1|Mental & behavioural disorder due to use of cannabinoids: harmful use
F12.2|Mental & behavioural disorder due to use of cannabinoids: dependence syndrome
F12.3|Mental & behavioural disorder due to use of cannabinoids: withdrawal state
F12.4|Mental & behavioural disorder due to use of cannabinoids: withdrawl state with delirium
F12.5|Mental & behavioural disorder due to use of cannabinoids: psychotic disorder
F12.6|Mental & behavioural disorder due to use of cannabinoids: amnesic syndrome
F12.7|Mental & behavioural disorder due to use of cannabinoids: residual & late-onset psychotic disorder
F12.8|Mental & behavioural disorder due to use of cannabinoids: other mental & behavioural disorder
F12.9|Mental & behavioural disorder due to use of cannabinoids: unspecified mental & behavioural disorder
F13|Mental and behavioural disorders due to use of sedatives or hypnotics
F13.0|Mental & behavioural disorder due to use of sedatives  or hypnotics: acute intoxication
F13.1|Mental & behavioural disorder due to use of sedatives  or hypnotics: harmful use
F13.2|Mental & behavioural disorder due to use of sedatives  or hypnotics: dependence syndrome
F13.3|Mental & behavioural disorder due to use of sedatives  or hypnotics: withdrawal state
F13.4|Mental & behavioural disorder due to use of sedatives  or hypnotics: withdrawl state with delirium
F13.5|Mental & behavioural disorder due to use of sedatives  or hypnotics: psychotic disorder
F13.6|Mental & behavioural disorder due to use of sedatives  or hypnotics: amnesic syndrome
F13.7|Mental & behavioural disorder due to use of sedatives  or hypnotics: residual & late-onset psychotic disorder
F13.8|Mental & behavioural disorder due to use of sedatives  or hypnotics: other mental & behavioural disorder
F13.9|Mental & behavioural disorder due to use of sedatives  or hypnotics: unspecified mental & behavioural disorder
F14|Mental and behavioural disorders due to use of cocaine
F14.0|Mental & behavioural disorder due to use of cocaine: acute intoxication
F14.1|Mental & behavioural disorder due to use of cocaine: harmful use
F14.2|Mental & behavioural disorder due to use of cocaine: dependence syndrome
F14.3|Mental & behavioural disorder due to use of cocaine: withdrawal state
F14.4|Mental & behavioural disorder due to use of cocaine: withdrawl state with delirium
F14.5|Mental & behavioural disorder due to use of cocaine: psychotic disorder
F14.6|Mental & behavioural disorder due to use of cocaine: amnesic syndrome
F14.7|Mental & behavioural disorder due to use of cocaine: residual & late-onset psychotic disorder
F14.8|Mental & behavioural disorder due to use of cocaine: other mental & behavioural disorder
F14.9|Mental & behavioural disorder due to use of cocaine: unspecified mental & behavioural disorder
F15|Mental and behavioural disorders due to use of other stimulants, including caffeine
F15.0|Mental & behavioural disorder due to use of  other stimulants, including caffeine: acute intoxication
F15.1|Mental & behavioural disorder due to use of  other stimulants, including caffeine: harmful use
F15.2|Mental & behavioural disorder due to use of  other stimulants, including caffeine: dependence syndrome
F15.3|Mental & behavioural disorder due to use of  other stimulants, including caffeine: withdrawal state
F15.4|Mental & behavioural disorder due to use of  other stimulants, including caffeine: withdrawl state with delirium
F15.5|Mental & behavioural disorder due to use of  other stimulants, including caffeine: psychotic disorder
F15.6|Mental & behavioural disorder due to use of  other stimulants, including caffeine: amnesic syndrome
F15.7|Mental & behavioural disorder due to use of  other stimulants, including caffeine: residual & late-onset psychotic disorder
F15.8|Mental & behavioural disorder due to use of  other stimulants, including caffeine: other mental & behavioural disorder
F15.9|Mental & behavioural disorder due to use of  other stimulants, including caffeine: unspecified mental & behavioural disorder
F16|Mental and behavioural disorders due to use of hallucinogens
F16.0|Mental & behavioural disorder due to use hallucinogens: acute intoxication
F16.1|Mental & behavioural disorder due to use hallucinogens: harmful use
F16.2|Mental & behavioural disorder due to use hallucinogens: dependence syndrome
F16.3|Mental & behavioural disorder due to use hallucinogens: withdrawal state
F16.4|Mental & behavioural disorder due to use hallucinogens: withdrawl state with delirium
F16.5|Mental & behavioural disorder due to use hallucinogens: psychotic disorder
F16.6|Mental & behavioural disorder due to use hallucinogens: amnesic syndrome
F16.7|Mental & behavioural disorder due to use hallucinogens: residual & late-onset psychotic disorder
F16.8|Mental & behavioural disorder due to use hallucinogens: other mental & behavioural disorder
F16.9|Mental & behavioural disorder due to use hallucinogens: unspecified mental & behavioural disorder
F17|Mental and behavioural disorders due to use of tobacco
F17.0|Mental & behavioural disorder due of tobacco: acute intoxication
F17.1|Mental & behavioural disorder due of tobacco: harmful use
F17.2|Mental & behavioural disorder due of tobacco: dependence syndrome
F17.3|Mental & behavioural disorder due of tobacco: withdrawal state
F17.4|Mental & behavioural disorder due of tobacco: withdrawl state with delirium
F17.5|Mental & behavioural disorder due of tobacco: psychotic disorder
F17.6|Mental & behavioural disorder due of tobacco: amnesic syndrome
F17.7|Mental & behavioural disorder due of tobacco: residual & late-onset psychotic disorder
F17.8|Mental & behavioural disorder due of tobacco: other mental & behavioural disorder
F17.9|Mental & behavioural disorder due of tobacco: unspecified mental & behavioural disorder
F18|Mental and behavioural disorders due to use of volatile solvents
F18.0|Mental & behavioural disorder due of volatile solvents: acute intoxication
F18.1|Mental & behavioural disorder due of volatile solvents: harmful use
F18.2|Mental & behavioural disorder due of volatile solvents: dependence syndrome
F18.3|Mental & behavioural disorder due of volatile solvents: withdrawal state
F18.4|Mental & behavioural disorder due of volatile solvents: withdrawl state with delirium
F18.5|Mental & behavioural disorder due of volatile solvents: psychotic disorder
F18.6|Mental & behavioural disorder due of volatile solvents: amnesic syndrome
F18.7|Mental & behavioural disorder due of volatile solvents: residual & late-onset psychotic disorder
F18.8|Mental & behavioural disorder due of volatile solvents: other mental & behavioural disorder
F18.9|Mental & behavioural disorder due of volatile solvents: unspecified mental & behavioural disorder
F19|Mental and behavioural disorders due to multiple drug use and use of other psychoactive substances
F19.0|Mental & behavioural disorder due to multiple drug use and use of other psychoactive substances: acute intoxication
F19.1|Mental & behavioural disorder due to multiple drug use and use of other psychoactive substances: harmful use
F19.2|Mental & behavioural disorder due to multiple drug use and use of other psychoactive substances: dependence syndrome
F19.3|Mental & behavioural disorder due to multiple drug use and use of other psychoactive substances: withdrawal state
F19.4|Mental & behavioural disorder due to multiple drug use and use of other psychoactive substances: withdrawl state with delirium
F19.5|Mental & behavioural disorder due to multiple drug use and use of other psychoactive substances: psychotic disorder
F19.6|Mental & behavioural disorder due to multiple drug use and use of other psychoactive substances: amnesic syndrome
F19.7|Mental & behavioural disorder due to multiple drug use and use of other psychoactive substances: residual & late-onset psychotic disorder
F19.8|Mental & behavioural disorder due to multiple drug use and use of other psychoactive substances: other mental & behavioural disorder
F19.9|Mental & behavioural disorder due to multiple drug use and use of other psychoactive substances: unspecified mental & behavioural disorder
F20|Schizophrenia
F20.0|Paranoid schizophrenia
F20.1|Hebephrenic schizophrenia
F20.2|Catatonic schizophrenia
F20.3|Undifferentiated schizophrenia
F20.4|Post-schizophrenic depression
F20.5|Residual schizophrenia
F20.6|Simple schizophrenia
F20.8|Other schizophrenia
F20.9|Schizophrenia, unspecified
F21|Schizotypal disorder
F22|Persistent delusional disorders
F22.0|Delusional disorder
F22.8|Other persistent delusional disorders
F22.9|Persistent delusional disorder, unspecified
F23|Acute and transient psychotic disorders
F23.0|Acute polymorphic psychot disorder without symptoms of schizophrenia
F23.1|Acute polymorphic psychot disorder with symptoms of schizophrenia
F23.2|Acute schizophrenia-like psychotic disorder
F23.3|Other acute predominantly delusional psychotic disorders
F23.8|Other acute and transient psychotic disorders
F23.9|Acute and transient psychotic disorder, unspecified
F24|Induced delusional disorder
F25|Schizoaffective disorders
F25.0|Schizoaffective disorder, manic type
F25.1|Schizoaffective disorder, depressive type
F25.2|Schizoaffective disorder, mixed type
F25.8|Other schizoaffective disorders
F25.9|Schizoaffective disorder, unspecified
F28|Other nonorganic psychotic disorders
F29|Unspecified nonorganic psychosis
F30|Manic episode
F30.0|Hypomania
F30.1|Mania without psychotic symptoms
F30.2|Mania with psychotic symptoms
F30.8|Other manic episodes
F30.9|Manic episode, unspecified
F31|Bipolar affective disorder
F31.0|Bipolar affective disorder, current episode hypomanic
F31.1|Bipolar affective disorder, current episode without psychotic symptoms
F31.2|Bipolar affective disorder, current episode manic with psychotic symptoms
F31.3|Bipolar affective disorder, current episode mild or moderate depression
F31.4|Bipolar affective disorder, current episode severe depression without psychotic symptoms
F31.5|Bipolar affective disorder, current episode severe depression with psychotic symptoms
F31.6|Bipolar affective disorder, current episode mixed
F31.7|Bipolar affective disorder, currently in remission
F31.8|Other bipolar affective disorders
F31.9|Bipolar affective disorder, unspecified
F32|Depressive episode
F32.0|Mild depressive episode
F32.1|Moderate depressive episode
F32.2|Severe depressive episode without psychotic symptoms
F32.3|Severe depressive episode with psychotic symptoms
F32.8|Other depressive episodes
F32.9|Depressive episode, unspecified
F33|Recurrent depressive disorder
F33.0|Recurrent depressive disorder, current episode mild
F33.1|Recurrent depressive disorder, current episode moderate
F33.2|Recurrent depress disorder current episode severe without symptoms
F33.3|Recurrent depress disorder current episode severe with psyc symp
F33.4|Recurrent depressive disorder, currently in remission
F33.8|Other recurrent depressive disorders
F33.9|Recurrent depressive disorder, unspecified
F34|Persistent mood [affective] disorders
F34.0|Cyclothymia
F34.1|Dysthymia
F34.8|Other persistent mood [affective] disorders
F34.9|Persistent mood [affective] disorder, unspecified
F38|Other mood [affective] disorders
F38.0|Other single mood [affective] disorders
F38.1|Other recurrent mood [affective] disorders
F38.8|Other specified mood [affective] disorders
F39|Unspecified mood [affective] disorder
F40|Phobic anxiety disorders
F40.0|Agoraphobia
F40.1|Social phobias
F40.2|Specific (isolated) phobias
F40.8|Other phobic anxiety disorders
F40.9|Phobic anxiety disorder, unspecified
F41|Other anxiety disorders
F41.0|Panic disorder [episodic paroxysmal anxiety]
F41.1|Generalized anxiety disorder
F41.2|Mixed anxiety and depressive disorder
F41.3|Other mixed anxiety disorders
F41.8|Other specified anxiety disorders
F41.9|Anxiety disorder, unspecified
F42|Obsessive-compulsive disorder
F42.0|Predominantly obsessional thoughts or ruminations
F42.1|Predominantly compulsive acts [obsessional rituals]
F42.2|Mixed obsessional thoughts and acts
F42.8|Other obsessive-compulsive disorders
F42.9|Obsessive-compulsive disorder, unspecified
F43|Reaction to severe stress, and adjustment disorders
F43.0|Acute stress reaction
F43.1|Post-traumatic stress disorder
F43.2|Adjustment disorders
F43.8|Other reactions to severe stress
F43.9|Reaction to severe stress, unspecified
F44|Dissociative [conversion] disorders
F44.0|Dissociative amnesia
F44.1|Dissociative fugue
F44.2|Dissociative stupor
F44.3|Trance and possession disorders
F44.4|Dissociative motor disorders
F44.5|Dissociative convulsions
F44.6|Dissociative anaesthesia and sensory loss
F44.7|Mixed dissociative [conversion] disorders
F44.8|Other dissociative [conversion] disorders
F44.9|Dissociative [conversion] disorder, unspecified
F45|Somatoform disorders
F45.0|Somatization disorder
F45.1|Undifferentiated somatoform disorder
F45.2|Hypochondriacal disorder
F45.3|Somatoform autonomic dysfunction
F45.4|Persistent somatoform pain disorder
F45.8|Other somatoform disorders
F45.9|Somatoform disorder, unspecified
F48|Other neurotic disorders
F48.0|Neurasthenia
F48.1|Depersonalization-derealization syndrome
F48.8|Other specified neurotic disorders
F48.9|Neurotic disorder, unspecified
F50|Eating disorders
F50.0|Anorexia nervosa
F50.1|Atypical anorexia nervosa
F50.2|Bulimia nervosa
F50.3|Atypical bulimia nervosa
F50.4|Overeating associated with other psychological disturbances
F50.5|Vomiting associated with other psychological disturbances
F50.8|Other eating disorders
F50.9|Eating disorder, unspecified
F51|Nonorganic sleep disorders
F51.0|Nonorganic insomnia
F51.1|Nonorganic hypersomnia
F51.2|Nonorganic disorder of the sleep-wake schedule
F51.3|Sleepwalking [somnambulism]
F51.4|Sleep terrors [night terrors]
F51.5|Nightmares
F51.8|Other nonorganic sleep disorders
F51.9|Nonorganic sleep disorder, unspecified
F52|Sexual dysfunction, not caused by organic disorder or disease
F52.0|Lack or loss of sexual desire
F52.1|Sexual aversion and lack of sexual enjoyment
F52.2|Failure of genital response
F52.3|Orgasmic dysfunction
F52.4|Premature ejaculation
F52.5|Nonorganic vaginismus
F52.6|Nonorganic dyspareunia
F52.7|Excessive sexual drive
F52.8|Other sexual dysfunction not caused by organic disorder/disease
F52.9|Unspecified sexual dysfunction not caused by organic disorder or disease
F53|Mental and behavioural disorders associated with the puerperium, not elsewhere classified
F53.0|Mild mental and behavioural disorder associated with the puerperium NEC
F53.1|Severe mental and behavioural disorder associated with puerperium NEC
F53.8|Other mental and behavioural disorder associated with the puerperium NEC
F53.9|Puerperal mental disorder, unspecified
F54|Psychological and behavioural factor associated with disord or disease Classified elsewhere
F55|Abuse of non-dependence-producing substances
F59|Unspecified behavaviural syndrome associated with physiological disturbances and physical factor
F60|Specific personality disorders
F60.0|Paranoid personality disorder
F60.1|Schizoid personality disorder
F60.2|Dissocial personality disorder
F60.3|Emotionally unstable personality disorder
F60.4|Histrionic personality disorder
F60.5|Anankastic personality disorder
F60.6|Anxious [avoidant] personality disorder
F60.7|Dependent personality disorder
F60.8|Other specific personality disorders
F60.9|Personality disorder, unspecified
F61|Mixed and other personality disorders
F62|Enduring personality changes, not attributable to brain damage and disease
F62.0|Enduring personality change after catastrophic experience
F62.1|Enduring personality change after psychiatric illness
F62.8|Other enduring personality changes
F62.9|Enduring personality change, unspecified
F63|Habit and impulse disorders
F63.0|Pathological gambling
F63.1|Pathological fire-setting [pyromania]
F63.2|Pathological stealing [kleptomania]
F63.3|Trichotillomania
F63.8|Other habit and impulse disorders
F63.9|Habit and impulse disorder, unspecified
F64|Gender identity disorders
F64.0|Transsexualism
F64.1|Dual-role transvestism
F64.2|Gender identity disorder of childhood
F64.8|Other gender identity disorders
F64.9|Gender identity disorder, unspecified
F65|Disorders of sexual preference
F65.0|Fetishism
F65.1|Fetishistic transvestism
F65.2|Exhibitionism
F65.3|Voyeurism
F65.4|Paedophilia
F65.5|Sadomasochism
F65.6|Multiple disorders of sexual preference
F65.8|Other disorders of sexual preference
F65.9|Disorder of sexual preference, unspecified
F66|Psychological and behavioural disorders associated with sexual development and orientation
F66.0|Sexual maturation disorder
F66.1|Egodystonic sexual orientation
F66.2|Sexual relationship disorder
F66.8|Other psychosexual development disorders
F66.9|Psychosexual development disorder, unspecified
F68|Other disorders of adult personality and behaviour
F68.0|Elaboration of physical symptoms for psychological reasons
F68.1|Intentional production/feigning of symptoms/disabilities either physical/psychological [factititous disorder)
F68.8|Other specified disorders of adult personality and behaviour
F69|Unspecified disorder of adult personality and behaviour
F70|Mild mental retardation
F70.0|Mild mental retardation: with statement no or minimal, impairment of behaviour
F70.1|Mild mental retardation: significant impairment behaviour requiring attentiom / treatment
F70.8|Mild mental retardation: other impairments of behaviour
F70.9|Mild mental retardation: without mention of impairment behaviour
F71|Moderate mental retardation
F71.0|Mod mental retardation: with statement no or minimal, impairment of behaviour
F71.1|Mod mental retardation: significant impairment behaviour requiring attentiom / treatment
F71.8|Mod mental retardation: other impairments of behaviour
F71.9|Mod mental retardation: without mention of impairment behaviour
F72|Severe mental retardation
F72.0|Severe mental retardation: with statement no or minimal, impairment of behaviour
F72.1|Severe mental retardation: significant impairment behaviour requiring attentiom / treatment
F72.8|Severe mental retardation: other impairments of behaviour
F72.9|Severe mental retardation: without mention of impairment behaviour
F73|Profound mental retardation
F73.0|Profound mental retardation: with statement no or minimal, impairment of behaviour
F73.1|Profound mental retardation: significant impairment behaviour requiring attentiom / treatment
F73.8|Profound mental retardation: other impairments of behaviour
F73.9|Profound mental retardation: without mention of impairment behaviour
F78|Other mental retardation
F78.0|other mental retardation: with statement no or minimal, impairment of behaviour
F78.1|other mental retardation: significant impairment behaviour requiring attentiom / treatment
F78.8|other mental retardation: other impairments of behaviour
F78.9|other mental retardation: without mention of impairment behaviour
F79|Unspecified mental retardation
F79.0|Unspecified mental retardation: with statement no or minimal, impairment of behaviour
F79.1|Unspecified mental retardation: significant impairment behaviour requiring attentiom / treatment
F79.8|Unspecified mental retardation: other impairments of behaviour
F79.9|Unspecified mental retardation: without mention of impairment behaviour
F80|Specific developmental disorders of speech and language
F80.0|Specific speech articulation disorder
F80.1|Expressive language disorder
F80.2|Receptive language disorder
F80.3|Acquired aphasia with epilepsy [landau-kleffner]
F80.8|Other developmental disorders of speech and language
F80.9|Developmental disorder of speech and language, unspecified
F81|Specific developmental disorders of scholastic skills
F81.0|Specific reading disorder
F81.1|Specific spelling disorder
F81.2|Specific disorder of arithmetical skills
F81.3|Mixed disorder of scholastic skills
F81.8|Other developmental disorders of scholastic skills
F81.9|Developmental disorder of scholastic skills, unspecified
F82|Specific developmental disorder of motor function
F83|Mixed specific developmental disorders
F84|Pervasive developmental disorders
F84.0|Childhood autism
F84.1|Atypical autism
F84.2|Rett's syndrome
F84.3|Other childhood disintegrative disorder
F84.4|Overactive disorder associated with mental retardation and stereotype movements
F84.5|Asperger's syndrome
F84.8|Other pervasive developmental disorders
F84.9|Pervasive developmental disorder, unspecified
F88|Other disorders of psychological development
F89|Unspecified disorder of psychological development
F90|Hyperkinetic disorders
F90.0|Disturbance of activity and attention
F90.1|Hyperkinetic conduct disorder
F90.8|Other hyperkinetic disorders
F90.9|Hyperkinetic disorder, unspecified
F91|Conduct disorders
F91.0|Conduct disorder confined to the family context
F91.1|Unsocialized conduct disorder
F91.2|Socialized conduct disorder
F91.3|Oppositional defiant disorder
F91.8|Other conduct disorders
F91.9|Conduct disorder, unspecified
F92|Mixed disorders of conduct and emotions
F92.0|Depressive conduct disorder
F92.8|Other mixed disorders of conduct and emotions
F92.9|Mixed disorder of conduct and emotions, unspecified
F93|Emotional disorders with onset specific to childhood
F93.0|Separation anxiety disorder of childhood
F93.1|Phobic anxiety disorder of childhood
F93.2|Social anxiety disorder of childhood
F93.3|Sibling rivalry disorder
F93.8|Other childhood emotional disorders
F93.9|Childhood emotional disorder, unspecified
F94|Disorders of social functioning with onset specific to childhood and adolescence
F94.0|Elective mutism
F94.1|Reactive attachment disorder of childhood
F94.2|Disinhibited attachment disorder of childhood
F94.8|Other childhood disorders of social functioning
F94.9|Childhood disorder of social functioning, unspecified
F95|Tic disorders
F95.0|Transient tic disorder
F95.1|Chronic motor or vocal tic disorder
F95.2|Combined vocal  multiple motor tic disorder [de la tourette]
F95.8|Other tic disorders
F95.9|Tic disorder, unspecified
F98|Other behavioural and emotional disorders with onset usually occurring in childhood and adolescence
F98.0|Nonorganic enuresis
F98.1|Nonorganic encopresis
F98.2|Feeding disorder of infancy and childhood
F98.3|Pica of infancy and childhood
F98.4|Stereotyped movement disorders
F98.5|Stuttering [stammering]
F98.6|Cluttering
F98.8|Other behavioral and emotional disorder onset usually ocurring childhood adolescence
F98.9|Unspecified behavioral and emotional disorder onset usually ocurring childhood adolescence
F99|Mental disorder, not otherwise specified
G00|Bacterial meningitis, not elsewhere classified
G00.0|Haemophilus meningitis
G00.1|Pneumococcal meningitis
G00.2|Streptococcal meningitis
G00.3|Staphylococcal meningitis
G00.8|Other bacterial meningitis
G00.9|Bacterial meningitis, unspecified
G01|Meningitis in bacterial diseases classified elsewhere
G02|Meningitis in other infectious and parasitic diseases classified elsewhere
G02.0|Meningitis in viral diseases classified elsewhere
G02.1|Meningitis in mycoses
G02.8|Meningitis in other spec infectious and parasitic dis ec
G03|Meningitis due to other and unspecified causes
G03.0|Nonpyogenic meningitis
G03.1|Chronic meningitis
G03.2|Benign recurrent meningitis [mollaret]
G03.8|Meningitis due to other specified causes
G03.9|Meningitis, unspecified
G04|Encephalitis, myelitis and encephalomyelitis
G04.0|Acute disseminated encephalitis
G04.1|Tropical spastic paraplegia
G04.2|Bacterial meningoencephalitis and meningomyelitis nec
G04.8|Other encephalitis, myelitis and encephalomyelitis
G04.9|Encephalitis, myelitis and encephalomyelitis, unspecified
G05|Encephalitis, myelitis and encephalomyelitis in diseases classified elsewhere
G05.0|Encephalitis, myelitis & encephalomyelitis in bacterial disease classified elsewhere
G05.1|Encephalitis, myelitis & encephalomyelitis in viral disease classified elsewhere
G05.2|Encephalitis myelitis encphlomyelitis  infectious and parasitic disease classified elsewhere
G05.8|Encephalitis, myelitis & encephalomyelitis in other disease classified elsewhere
G06|Intracranial and intraspinal abscess and granuloma
G06.0|Intracranial abscess and granuloma
G06.1|Intraspinal abscess and granuloma
G06.2|Extradural and subdural abscess, unspecified
G07|Intracranial and intraspinal abscess and granuloma disease classified elsewhere
G08|Intracranial and intraspinal phlebitis and thrombophlebitis
G09|Sequelae of inflammatory diseases of central nervous system
G10|Huntington's disease
G11|Hereditary ataxia
G11.0|Congenital nonprogressive ataxia
G11.1|Early-onset cerebellar ataxia
G11.2|Late-onset cerebellar ataxia
G11.3|Cerebellar ataxia with defective dna repair
G11.4|Hereditary spastic paraplegia
G11.8|Other hereditary ataxias
G11.9|Hereditary ataxia, unspecified
G12|Spinal muscular atrophy and related syndromes
G12.0|Infantile spinal muscular atrophy, type i [werdnig-hoffman]
G12.1|Other inherited spinal muscular atrophy
G12.2|Motor neuron disease
G12.8|Other spinal muscular atrophies and related syndromes
G12.9|Spinal muscular atrophy, unspecified
G13|Systemic atrophies primarily affecting central nervous system in diseases classified elsewhere
G13.0|Paraneoplastic neuromyopathy and neuropathy
G13.1|Other systemic atrophy primarily affect central nervous system neoplastic disease
G13.2|Systemic atrophy primarily affecting central nervous system in myxoedema
G13.8|Systemic atrophy primarily affecting central nervous system other disease classified elsewhere
G14|Postpolio syndrome
G20|Parkinson's disease
G21|Secondary parkinsonism
G21.0|Malignant neuroleptic syndrome
G21.1|Other drug-induced secondary parkinsonism
G21.2|Secondary parkinsonism due to other external agents
G21.3|Postencephalitic parkinsonism
G21.4|Vascular parkinsonism
G21.8|Other secondary parkinsonism
G21.9|Secondary parkinsonism, unspecified
G22|Parkinsonism in diseases classified elsewhere
G23|Other degenerative diseases of basal ganglia
G23.0|Hallervorden-Spatz disease
G23.1|Progressive supranuclear ophthalmoplegia
G23.2|Striatonigral degeneration
G23.8|Other specified degenerative diseases of basal ganglia
G23.9|Degenerative disease of basal ganglia, unspecified
G24|Dystonia
G24.0|Drug-induced dystonia
G24.1|Idiopathic familial dystonia
G24.2|Idiopathic nonfamilial dystonia
G24.3|Spasmodic torticollis
G24.4|Idiopathic orofacial dystonia
G24.5|Blepharospasm
G24.8|Other dystonia
G24.9|Dystonia, unspecified
G25|Other extrapyramidal and movement disorders
G25.0|Essential tremor
G25.1|Drug-induced tremor
G25.2|Other specified forms of tremor
G25.3|Myoclonus
G25.4|Drug-induced chorea
G25.5|Other chorea
G25.6|Drug-induced tics and other tics of organic origin
G25.8|Other specified extrapyramidal and movement disorders
G25.9|Extrapyramidal and movement disorder, unspecified
G26|Extrapyramidal and movement disorders in disease classified elsewhere
G30|Alzheimer disease
G30.0|Alzheimer's disease with early onset
G30.1|Alzheimer's disease with late onset
G30.8|Other alzheimer's disease
G30.9|Alzheimer's disease, unspecified
G31|Other degenerative diseases of nervous system, not elsewhere classified
G31.0|Circumscribed brain atrophy
G31.1|Senile degeneration of brain, not elsewhere classified
G31.2|Degeneration of nervous system due to alcohol
G31.8|Other specified degenerative diseases of nervous system
G31.9|Degenerative disease of nervous system, unspecified
G32|Other degenerative disorders of nervous system in diseases classified elsewhere
G32.0|Subacute combined degeneration of spinal cord in dis ec
G32.8|Other spec degenerative disorders of nervous system dis ec
G35|Multiple sclerosis
G36|Other acute disseminated demyelination
G36.0|Neuromyelitis optica [devic]
G36.1|Acute and subacute haemorrhagic leukoencephalitis [hurst]
G36.8|Other specified acute disseminated demyelination
G36.9|Acute disseminated demyelination, unspecified
G37|Other demyelinating diseases of central nervous system
G37.0|Diffuse sclerosis
G37.1|Central demyelination of corpus callosum
G37.2|Central pontine myelinolysis
G37.3|Acute transverse myelitis in demyelinating disease of cns
G37.4|Subacute necrotizing myelitis
G37.5|Concentric sclerosis [bal-]
G37.8|Other spec demyelinating diseases of central nervous system
G37.9|Demyelinating disease of central nervous system, unspecified
G40|Epilepsy
G40.0|Localization-related(focal)(partial)idiopathic epilepsy / epileptic syndromes seizures localized onset
G40.1|Localization-related(focal)(partial)idiopathic epilepsy / epileptic syndromes with simple partial seizures
G40.2|Localization-related(focal)(partial)idiopathic epilepsy / epileptic syndromes with complex partial seizures
G40.3|Generalized idiopathic epilepsy and epileptic syndromes
G40.4|Other generalized epilepsy and epileptic syndromes
G40.5|Special epileptic syndromes
G40.6|Grand mal seizures, unspecified (with or without petit mal)
G40.7|Petit mal, unspecified, without grand mal seizures
G40.8|Other epilepsy
G40.9|Epilepsy, unspecified
G41|Status epilepticus
G41.0|Grand mal status epilepticus
G41.1|Petit mal status epilepticus
G41.2|Complex partial status epilepticus
G41.8|Other status epilepticus
G41.9|Status epilepticus, unspecified
G43|Migraine
G43.0|Migraine without aura [common migraine]
G43.1|Migraine with aura [classical migraine]
G43.2|Status migrainosus
G43.3|Complicated migraine
G43.8|Other migraine
G43.9|Migraine, unspecified
G44|Other headache syndromes
G44.0|Cluster headache syndrome
G44.1|Vascular headache, not elsewhere classified
G44.2|Tension-type headache
G44.3|Chronic post-traumatic headache
G44.4|Drug-induced headache, not elsewhere classified
G44.8|Other specified headache syndromes
G45|Transient cerebral ischaemic attacks and related syndromes
G45.0|Vertebro-basilar artery syndrome
G45.1|Carotid artery syndrome (hemispheric)
G45.2|Multiple and bilateral precerebral artery syndromes
G45.3|Amaurosis fugax
G45.4|Transient global amnesia
G45.8|Other transient cerebral ischaemic attacks and related synd
G45.9|Transient cerebral ischaemic attack, unspecified
G46|Vascular syndromes of brain in cerebrovascular diseases
G46.0|Middle cerebral artery syndrome
G46.1|Anterior cerebral artery syndrome
G46.2|Posterior cerebral artery syndrome
G46.3|Brain stem stroke syndrome
G46.4|Cerebellar stroke syndrome
G46.5|Pure motor lacunar syndrome
G46.6|Pure sensory lacunar syndrome
G46.7|Other lacunar syndromes
G46.8|Other vascular syndromes of brain in cerebrovascular disease
G47|Sleep disorders
G47.0|Disorders of initiating and maintaining sleep [insomnias]
G47.1|Disorders of excessive somnolence [hypersomnias]
G47.2|Disorders of the sleep-wake schedule
G47.3|Sleep apnoea
G47.4|Narcolepsy and cataplexy
G47.8|Other sleep disorders
G47.9|Sleep disorder, unspecified
G50|Disorders of trigeminal nerve
G50.0|Trigeminal neuralgia
G50.1|Atypical facial pain
G50.8|Other disorders of trigeminal nerve
G50.9|Disorder of trigeminal nerve, unspecified
G51|Facial nerve disorders
G51.0|Bell's palsy
G51.1|Geniculate ganglionitis
G51.2|Melkersson's syndrome
G51.3|Clonic hemifacial spasm
G51.4|Facial myokymia
G51.8|Other disorders of facial nerve
G51.9|Disorder of facial nerve, unspecified
G52|Disorders of other cranial nerves
G52.0|Disorders of olfactory nerve
G52.1|Disorders of glossopharyngeal nerve
G52.2|Disorders of vagus nerve
G52.3|Disorders of hypoglossal nerve
G52.7|Disorders of multiple cranial nerves
G52.8|Disorders of other specified cranial nerves
G52.9|Cranial nerve disorder, unspecified
G53|Cranial nerve disorders in diseases classified elsewhere
G53.0|Postzoster neuralgia
G53.1|Multiple cranial nerve palsies in infectious & parasit disease classified elsewhere
G53.2|Multiple cranial nerve palsies in sarcoidosis
G53.3|Multiple cranial nerve palsies in neoplastic disease
G53.8|Other cranial nerve disorders in other disease classified elsewhere
G54|Nerve root and plexus disorders
G54.0|Brachial plexus disorders
G54.1|Lumbosacral plexus disorders
G54.2|Cervical root disorders, not elsewhere classified
G54.3|Thoracic root disorders, not elsewhere classified
G54.4|Lumbosacral root disorders, not elsewhere classified
G54.5|Neuralgic amyotrophy
G54.6|Phantom limb syndrome with pain
G54.7|Phantom limb syndrome without pain
G54.8|Other nerve root and plexus disorders
G54.9|Nerve root and plexus disorder, unspecified
G55|Nerve root and plexus compressions in diseases classified elsewhere
G55.0|Nerve root and plexus compressions in neoplastic disease
G55.1|Nerve root and plexus compressions in intravert disc disord
G55.2|Nerve root and plexus compressions in spondylosis
G55.3|Nerve root and plexus compressions in oth dorsopathies
G55.8|Nerve root and plexus compressions in other disease classified elsewhere
G56|Mononeuropathies of upper limb
G56.0|Carpal tunnel syndrome
G56.1|Other lesions of median nerve
G56.2|Lesion of ulnar nerve
G56.3|Lesion of radial nerve
G56.4|Causalgia
G56.8|Other mononeuropathies of upper limb
G56.9|Mononeuropathy of upper limb, unspecified
G57|Mononeuropathies of lower limb
G57.0|Lesion of sciatic nerve
G57.1|Meralgia paraesthetica
G57.2|Lesion of femoral nerve
G57.3|Lesion of lateral popliteal nerve
G57.4|Lesion of medial popliteal nerve
G57.5|Tarsal tunnel syndrome
G57.6|Lesion of plantar nerve
G57.8|Other mononeuropathies of lower limb
G57.9|Mononeuropathy of lower limb, unspecified
G58|Other mononeuropathies
G58.0|Intercostal neuropathy
G58.7|Mononeuritis multiplex
G58.8|Other specified mononeuropathies
G58.9|Mononeuropathy, unspecified
G59|Mononeuropathy in diseases classified elsewhere
G59.0|Diabetic mononeuropathy
G59.8|Other mononeuropathies in diseases classified elsewhere
G60|Hereditary and idiopathic neuropathy
G60.0|Hereditary motor and sensory neuropathy
G60.1|Refsum's disease
G60.2|Neuropathy in association with hereditary ataxia
G60.3|Idiopathic progressive neuropathy
G60.8|Other hereditary and idiopathic neuropathies
G60.9|Hereditary and idiopathic neuropathy, unspecified
G61|Inflammatory polyneuropathy
G61.0|Guillain-barre syndrome
G61.1|Serum neuropathy
G61.8|Other inflammatory polyneuropathies
G61.9|Inflammatory polyneuropathy, unspecified
G62|Other polyneuropathies
G62.0|Drug-induced polyneuropathy
G62.1|Alcoholic polyneuropathy
G62.2|Polyneuropathy due to other toxic agents
G62.8|Other specified polyneuropathies
G62.9|Polyneuropathy, unspecified
G63|Polyneuropathy in diseases classified elsewhere
G63.0|Polyneuropathy in infectious and parasitic disease classified elsewhere
G63.1|Polyneuropathy in neoplastic disease
G63.2|Diabetic polyneuropathy
G63.3|Polyneuropathy in other endocrine and metabolic diseases
G63.4|Polyneuropathy in nutritional deficiency
G63.5|Polyneuropathy in systemic connective tissue disorders
G63.6|Polyneuropathy in other musculoskeletal disorders
G63.8|Polyneuropathy in other diseases classified elsewhere
G64|Other disorders of peripheral nervous system
G70|Myasthenia gravis and other myoneural disorders
G70.0|Myasthenia gravis
G70.1|Toxic myoneural disorders
G70.2|Congenital and developmental myasthenia
G70.8|Other specified myoneural disorders
G70.9|Myoneural disorder, unspecified
G71|Primary disorders of muscles
G71.0|Muscular dystrophy
G71.1|Myotonic disorders
G71.2|Congenital myopathies
G71.3|Mitochondrial myopathy, not elsewhere classified
G71.8|Other primary disorders of muscles
G71.9|Primary disorder of muscle, unspecified
G72|Other myopathies
G72.0|Drug-induced myopathy
G72.1|Alcoholic myopathy
G72.2|Myopathy due to other toxic agents
G72.3|Periodic paralysis
G72.4|Inflammatory myopathy, not elsewhere classified
G72.8|Other specified myopathies
G72.9|Myopathy, unspecified
G73|Disorders of myoneural junction and muscle in diseases classified elsewhere
G73.0|Myasthenic syndromes in endocrine diseases
G73.1|Eaton-lambert syndrome
G73.2|Other myasthenic syndromes in neoplastic disease
G73.3|Myasthenic syndromes in other diseases classified elsewhere
G73.4|Myopathy in infectious and parasitic disease classified elsewhere
G73.5|Myopathy in endocrine diseases
G73.6|Myopathy in metabolic diseases
G73.7|Myopathy in other diseases classified elsewhere
G80|Cerebral palsy
G80.0|Spastic cerebral palsy
G80.1|Spastic diplegia
G80.2|Infantile hemiplegia
G80.3|Dyskinetic cerebral palsy
G80.4|Ataxic cerebral palsy
G80.8|Other infantile cerebral palsy
G80.9|Infantile cerebral palsy, unspecified
G81|Hemiplegia
G81.0|Flaccid hemiplegia
G81.1|Spastic hemiplegia
G81.9|Hemiplegia, unspecified
G82|Paraplegia and tetraplegia
G82.0|Flaccid paraplegia
G82.1|Spastic paraplegia
G82.2|Paraplegia, unspecified
G82.3|Flaccid tetraplegia
G82.4|Spastic tetraplegia
G82.5|Tetraplegia, unspecified
G83|Other paralytic syndromes
G83.0|Diplegia of upper limbs
G83.1|Monoplegia of lower limb
G83.2|Monoplegia of upper limb
G83.3|Monoplegia, unspecified
G83.4|Cauda equina syndrome
G83.8|Other specified paralytic syndromes
G83.9|Paralytic syndrome, unspecified
G90|Disorders of autonomic nervous system
G90.0|Idiopathic peripheral autonomic neuropathy
G90.1|Familial dysautonomia [riley-day]
G90.2|Horner's syndrome
G90.3|Multi-system degeneration
G90.4|Autonomic dysreflexia
G90.8|Other disorders of autonomic nervous system
G90.9|Disorder of autonomic nervous system, unspecified
G91|Hydrocephalus
G91.0|Communicating hydrocephalus
G91.1|Obstructive hydrocephalus
G91.2|Normal-pressure hydrocephalus
G91.3|Post-traumatic hydrocephalus, unspecified
G91.8|Other hydrocephalus
G91.9|Hydrocephalus, unspecified
G92|Toxic encephalopathy
G93|Other disorders of brain
G93.0|Cerebral cysts
G93.1|Anoxic brain damage, not elsewhere classified
G93.2|Benign intracranial hypertension
G93.3|Postviral fatigue syndrome
G93.4|Encephalopathy, unspecified
G93.5|Compression of brain
G93.6|Cerebral oedema
G93.7|Reye's syndrome
G93.8|Other specified disorders of brain
G93.9|Disorder of brain, unspecified
G94|Other disorders of brain in diseases classified elsewhere
G94.0|Hydrocephalus in infectious and parasitic disease classified elsewhere
G94.1|Hydrocephalus in neoplastic disease
G94.2|Hydrocephalus in other diseases classified elsewhere
G94.8|Other specified disorders of brain in disease classified elsewhere
G95|Other diseases of spinal cord
G95.0|Syringomyelia and syringobulbia
G95.1|Vascular myelopathies
G95.2|Cord compression, unspecified
G95.8|Other specified diseases of spinal cord
G95.9|Disease of spinal cord, unspecified
G96|Other disorders of central nervous system
G96.0|Cerebrospinal fluid leak
G96.1|Disorders of meninges, not elsewhere classified
G96.8|Other specified disorders of central nervous system
G96.9|Disorder of central nervous system, unspecified
G97|Postprocedural disorders of nervous system, not elsewhere classified
G97.0|Cerebrospinal fluid leak from spinal puncture
G97.1|Other reaction to spinal and lumbar puncture
G97.2|Intracranial hypotension following ventricular shunting
G97.8|Other postprocedural disorders of nervous system
G97.9|Postprocedural disorder of nervous system, unspecified
G98|Other disorders of nervous system, not elsewhere classified
G99|Other disorders of nervous system in diseases classified elsewhere
G99.0|Autonomic neuropathy in endocrine and metabolic diseases
G99.1|Other disorders of autonomic nervous system in other disease classified elsewhere
G99.2|Myelopathy in diseases classified elsewhere
G99.8|Other specified disorders of nervous system in diseases ec
H00|Hordeolum and chalazion
H00.0|Hordeolum and other deep inflammation of eyelid
H00.1|Chalazion
H01|Other inflammation of eyelid
H01.0|Blepharitis
H01.1|Noninfectious dermatoses of eyelid
H01.8|Other specified inflammation of eyelid
H01.9|Inflammation of eyelid, unspecified
H02|Other disorders of eyelid
H02.0|Entropion and trichiasis of eyelid
H02.1|Ectropion of eyelid
H02.2|Lagophthalmos
H02.3|Blepharochalasis
H02.4|Ptosis of eyelid
H02.5|Other disorders affecting eyelid function
H02.6|Xanthelasma of eyelid
H02.7|Other degenerative disorders of eyelid and periocular area
H02.8|Other specified disorders of eyelid
H02.9|Disorder of eyelid, unspecified
H03|Disorders of eyelid in diseases classified elsewhere
H03.0|Parasitic infestation of eyelid in diseases classified
H03.1|Involvement of eyelid in other infectious diseases classified elsewhere
H03.8|Involvement of eyelid in other diseases classified elsewhere
H04|Disorders of lacrimal system
H04.0|Dacryoadenitis
H04.1|Other disorders of lacrimal gland
H04.2|Epiphora
H04.3|Acute and unspecified inflammation of lacrimal passages
H04.4|Chronic inflammation of lacrimal passages
H04.5|Stenosis and insufficiency of lacrimal passages
H04.6|Other changes in lacrimal passages
H04.8|Other disorders of lacrimal system
H04.9|Disorder of lacrimal system, unspecified
H05|Disorders of orbit
H05.0|Acute inflammation of orbit
H05.1|Chronic inflammatory disorders of orbit
H05.2|Exophthalmic conditions
H05.3|Deformity of orbit
H05.4|Enophthalmos
H05.5|Retained (old) foreign body folowing penetrating wound of orbit
H05.8|Other disorders of orbit
H05.9|Disorder of orbit, unspecified
H06|Disorders of lacrimal system and orbit in diseases classified elsewhere
H06.0|Disorders of lacrimal system in diseases classified elsewhere
H06.1|Parasitic infestation of orbit in diseases classified elsewhere
H06.2|Dysthyroid exophthalmos
H06.3|Other disorders of orbit in diseases classified elsewhere
H10|Conjunctivitis
H10.0|Mucopurulent conjunctivitis
H10.1|Acute atopic conjunctivitis
H10.2|Other acute conjunctivitis
H10.3|Acute conjunctivitis, unspecified
H10.4|Chronic conjunctivitis
H10.5|Blepharoconjunctivitis
H10.8|Other conjunctivitis
H10.9|Conjunctivitis, unspecified
H11|Other disorders of conjunctiva
H11.0|Pterygium
H11.1|Conjunctival degenerations and deposits
H11.2|Conjunctival scars
H11.3|Conjunctival haemorrhage
H11.4|Other conjunctival vascular disorders and cysts
H11.8|Other specified disorders of conjunctiva
H11.9|Disorder of conjunctiva, unspecified
H13|Disorders of conjunctiva in diseases classified elsewhere
H13.0|Filarial infection of conjunctiva
H13.1|Conjunctivitis in infectious and parasitic diseases classified elsewhere
H13.2|Conjunctivitis in other diseases classified elsewhere
H13.3|Ocular pemphigoid
H13.8|Other disorders of conjunctiva in diseases classified elsewhere
H15|Disorders of sclera
H15.0|Scleritis
H15.1|Episcleritis
H15.8|Other disorders of sclera
H15.9|Disorder of sclera, unspecified
H16|Keratitis
H16.0|Corneal ulcer
H16.1|Other superficial keratitis without conjunctivitis
H16.2|Keratoconjunctivitis
H16.3|Interstitial and deep keratitis
H16.4|Corneal neovascularization
H16.8|Other keratitis
H16.9|Keratitis, unspecified
H17|Corneal scars and opacities
H17.0|Adherent leukoma
H17.1|Other central corneal opacity
H17.8|Other corneal scars and opacities
H17.9|Corneal scar and opacity, unspecified
H18|Other disorders of cornea
H18.0|Corneal pigmentations and deposits
H18.1|Bullous keratopathy
H18.2|Other corneal oedema
H18.3|Changes in corneal membranes
H18.4|Corneal degeneration
H18.5|Hereditary corneal dystrophies
H18.6|Keratoconus
H18.7|Other corneal deformities
H18.8|Other specified disorders of cornea
H18.9|Disorder of cornea, unspecified
H19|Disorders of sclera and cornea in diseases classified elsewhere
H19.0|Scleritis and episcleritis in diseases classified elsewhere
H19.1|Herpesviral keratitis and keratoconjunctivitis
H19.2|Keratitis and keratoconjunctivitis in other infectious and parasitic disease classified elsewhere
H19.3|Keratitis and keratoconjunctivitis in other diseases classified elsewhere
H19.8|Other disorders of sclera and cornea in diseases classified elsewhere
H20|Iridocyclitis
H20.0|Acute and subacute iridocyclitis
H20.1|Chronic iridocyclitis
H20.2|Lens-induced iridocyclitis
H20.8|Other iridocyclitis
H20.9|Iridocyclitis, unspecified
H21|Other disorders of iris and ciliary body
H21.0|Hyphaema
H21.1|Other vascular disorders of iris and ciliary body
H21.2|Degeneration of iris and ciliary body
H21.3|Cyst of iris, ciliary body and anterior chamber
H21.4|Pupillary membranes
H21.5|Other adhesions and disruptions of iris and ciliary body
H21.8|Other specified disorders of iris and ciliary body
H21.9|Disorder of iris and ciliary body, unspecified
H22|Disorders of iris and ciliary body in diseases classified elsewhere
H22.0|Iridocyclitis in infectious and parasitic diseases classified elsewhere
H22.1|Iridocyclitis in other diseases classified elsewhere
H22.8|Other disorders of iris and ciliary body in diseases classified elsewhere
H25|Senile cataract
H25.0|Senile incipient cataract
H25.1|Senile nuclear cataract
H25.2|Senile cataract, morgagnian type
H25.8|Other senile cataract
H25.9|Senile cataract, unspecified
H26|Other cataract
H26.0|Infantile, juvenile and presenile cataract
H26.1|Traumatic cataract
H26.2|Complicated cataract
H26.3|Drug-induced cataract
H26.4|After-cataract
H26.8|Other specified cataract
H26.9|Cataract, unspecified
H27|Other disorders of lens
H27.0|Aphakia
H27.1|Dislocation of lens
H27.8|Other specified disorders of lens
H27.9|Disorder of lens, unspecified
H28|Cataract and other disorders of lens in diseases classified elsewhere
H28.0|Diabetic cataract (E10-E14 with common fourth character 3)
H28.1|Cataract in other endocrine, nutritional and metabolic diseases
H28.2|Cataract in other diseases classified elsewhere
H28.8|Other disorders of lens in diseases classified elsewhere
H30|Chorioretinal inflammation
H30.0|Focal chorioretinal inflammation
H30.1|Disseminated chorioretinal inflammation
H30.2|Posterior cyclitis
H30.8|Other chorioretinal inflammations
H30.9|Chorioretinal inflammation, unspecified
H31|Other disorders of choroid
H31.0|Chorioretinal scars
H31.1|Choroidal degeneration
H31.2|Hereditary choroidal dystrophy
H31.3|Choroidal haemorrhage and rupture
H31.4|Choroidal detachment
H31.8|Other specified disorders of choroid
H31.9|Disorder of choroid, unspecified
H32|Chorioretinal disorders in diseases classified elsewhere
H32.0|Chorioretinal inflammation infectious and parasitic diseases classified elsewhere
H32.8|Other chorioretinal disorders in diseases classified elsewhere
H33|Retinal detachments and breaks
H33.0|Retinal detachment with retinal break
H33.1|Retinoschisis and retinal cysts
H33.2|Serous retinal detachment
H33.3|Retinal breaks without detachment
H33.4|Traction detachment of retina
H33.5|Other retinal detachments
H34|Retinal vascular occlusions
H34.0|Transient retinal artery occlusion
H34.1|Central retinal artery occlusion
H34.2|Other retinal artery occlusions
H34.8|Other retinal vascular occlusions
H34.9|Retinal vascular occlusion, unspecified
H35|Other retinal disorders
H35.0|Background retinopathy and retinal vascular changes
H35.1|Retinopathy of prematurity
H35.2|Other proliferative retinopathy
H35.3|Degeneration of macula and posterior pole
H35.4|Peripheral retinal degeneration
H35.5|Hereditary retinal dystrophy
H35.6|Retinal haemorrhage
H35.7|Separation of retinal layers
H35.8|Other specified retinal disorders
H35.9|Retinal disorder, unspecified
H36|Retinal disorders in diseases classified elsewhere
H36.0|Diabetic retinopathy (E10-E14 with common fourth character 3)
H36.8|Other retinal disorders in diseases classified elsewhere
H40|Glaucoma
H40.0|Glaucoma suspect
H40.1|Primary open-angle glaucoma
H40.2|Primary angle-closure glaucoma
H40.3|Glaucoma secondary to eye trauma
H40.4|Glaucoma secondary to eye inflammation
H40.5|Glaucoma secondary to other eye disorders
H40.6|Glaucoma secondary to drugs
H40.8|Other glaucoma
H40.9|Glaucoma, unspecified
H42|Glaucoma in diseases classified elsewhere
H42.0|Glaucoma in endocrine, nutritional and metabolic diseases
H42.8|Glaucoma in other diseases classified elsewhere
H43|Disorders of vitreous body
H43.0|Vitreous prolapse
H43.1|Vitreous haemorrhage
H43.2|Crystalline deposits in vitreous body
H43.3|Other vitreous opacities
H43.8|Other disorders of vitreous body
H43.9|Disorder of vitreous body, unspecified
H44|Disorders of globe
H44.0|Purulent endophthalmitis
H44.1|Other endophthalmitis
H44.2|Degenerative myopia
H44.3|Other degenerative disorders of globe
H44.4|Hypotony of eye
H44.5|Degenerated conditions of globe
H44.6|Retained (old) intraocular foreign body, magnetic
H44.7|Retained (old) intraocular foreign body, nonmagnetic
H44.8|Other disorders of globe
H44.9|Disorder of globe, unspecified
H45|Disorders of vitreous body and globe in diseases classified elsewhere
H45.0|Vitreous haemorrhage in diseases classified elsewhere
H45.1|Endophthalmitis in diseases classified elsewhere
H45.8|Other disorders of vitreous body and globe in diseases classified elsewhere
H46|Optic neuritis
H47|Other disorders of optic [2nd] nerve and visual pathways
H47.0|Disorders of optic nerve, not elsewhere classified
H47.1|Papilloedema, unspecified
H47.2|Optic atrophy
H47.3|Other disorders of optic disc
H47.4|Disorders of optic chiasm
H47.5|Disorders of other visual pathways
H47.6|Disorders of visual cortex
H47.7|Disorder of visual pathways, unspecified
H48|Disorders of optic [2nd] nerve and visual pathways in diseases classified elsewhere
H48.0|Optic atrophy in diseases classified elsewhere
H48.1|Retrobulbar neuritis in diseases classified elsewhere
H48.8|Other disorder of optic nerve and visual pathways in diseases classified elsewhere
H49|Paralytic strabismus
H49.0|Third [oculomotor] nerve palsy
H49.1|Fourth [trochlear] nerve palsy
H49.2|Sixth [abducent] nerve palsy
H49.3|Total (external) ophthalmoplegia
H49.4|Progressive external ophthalmoplegia
H49.8|Other paralytic strabismus
H49.9|Paralytic strabismus, unspecified
H50|Other strabismus
H50.0|Convergent concomitant strabismus
H50.1|Divergent concomitant strabismus
H50.2|Vertical strabismus
H50.3|Intermittent heterotropia
H50.4|Other and unspecified heterotropia
H50.5|Heterophoria
H50.6|Mechanical strabismus
H50.8|Other specified strabismus
H50.9|Strabismus, unspecified
H51|Other disorders of binocular movement
H51.0|Palsy of conjugate gaze
H51.1|Convergence insufficiency and excess
H51.2|Internuclear ophthalmoplegia
H51.8|Other specified disorders of binocular movement
H51.9|Disorder of binocular movement, unspecified
H52|Disorders of refraction and accommodation
H52.0|Hypermetropia
H52.1|Myopia
H52.2|Astigmatism
H52.3|Anisometropia and aniseikonia
H52.4|Presbyopia
H52.5|Disorders of accommodation
H52.6|Other disorders of refraction
H52.7|Disorder of refraction, unspecified
H53|Visual disturbances
H53.0|Amblyopia ex anopsia
H53.1|Subjective visual disturbances
H53.2|Diplopia
H53.3|Other disorders of binocular vision
H53.4|Visual field defects
H53.5|Colour vision deficiencies
H53.6|Night blindness
H53.8|Other visual disturbances
H53.9|Visual disturbance, unspecified
H54|Visual impairment including blindness (binocular or monocular)
H54.0|Blindness, both eyes
H54.1|Blindness, one eye, low vision other eye
H54.2|Low vision, both eyes
H54.3|Unqualified visual loss, both eyes
H54.4|Blindness, one eye
H54.5|Low vision, one eye
H54.6|Unqualified visual loss, one eye
H54.7|Unspecified visual loss
H54.9|Unspecified visual impairment (binocular)
H55|Nystagmus and other irregular eye movements
H57|Other disorders of eye and adnexa
H57.0|Anomalies of pupillary function
H57.1|Ocular pain
H57.8|Other specified disorders of eye and adnexa
H57.9|Disorder of eye and adnexa, unspecified
H58|Other disorders of eye and adnexa in diseases classified elsewhere
H58.0|Anomalies of pupillary function in diseases classified elsewhere
H58.1|Visual disturbances in diseases classified elsewhere
H58.8|Other specified disorders of eye and adnexa in diseases classified elsewhere
H59|Postprocedural disorders of eye and adnexa, not elsewhere classified
H59.0|Keratopathy (bullous aphakic) following cataract surgery
H59.8|Other postprocedural disorders of eye and adnexa
H59.9|Postprocedural disorder of eye and adnexa, unspecified
H60|Otitis externa
H60.0|Abscess of external ear
H60.1|Cellulitis of external ear
H60.2|Malignant otitis externa
H60.3|Other infective otitis externa
H60.4|Cholesteatoma of external ear
H60.5|Acute otitis externa, noninfective
H60.8|Other otitis externa
H60.9|Otitis externa, unspecified
H61|Other disorders of external ear
H61.0|Perichondritis of external ear
H61.1|Noninfective disorders of pinna
H61.2|Impacted cerumen
H61.3|Acquired stenosis of external ear canal
H61.8|Other specified disorders of external ear
H61.9|Disorder of external ear, unspecified
H62|Disorders of external ear in diseases classified elsewhere
H62.0|Otitis externa in bacterial diseases classified elsewhere
H62.1|Otitis externa in viral diseases classified elsewhere
H62.2|Otitis externa in mycoses
H62.3|Otitis externa in oth infectious and parasitic diseases classified elsewhere
H62.4|Otitis externa in other diseases classified elsewhere
H62.8|Other disorders of external ear in diseases classified elsewhere
H65|Nonsuppurative otitis media
H65.0|Acute serous otitis media
H65.1|Other acute nonsuppurative otitis media
H65.2|Chronic serous otitis media
H65.3|Chronic mucoid otitis media
H65.4|Other chronic nonsuppurative otitis media
H65.9|Nonsuppurative otitis media, unspecified
H66|Suppurative and unspecified otitis media
H66.0|Acute suppurative otitis media
H66.1|Chronic tubotympanic suppurative otitis media
H66.2|Chronic atticoantral suppurative otitis media
H66.3|Other chronic suppurative otitis media
H66.4|Suppurative otitis media, unspecified
H66.9|Otitis media, unspecified
H67|Otitis media in diseases classified elsewhere
H67.0|Otitis media in bacterial diseases classified elsewhere
H67.1|Otitis media in viral diseases classified elsewhere
H67.8|Otitis media in other diseases classified elsewhere
H68|Eustachian salpingitis and obstruction
H68.0|Eustachian salpingitis
H68.1|Obstruction of Eustachian tube
H69|Other disorders of Eustachian tube
H69.0|Patulous Eustachian tube
H69.8|Other specified disorders of Eustachian tube
H69.9|Eustachian tube disorder, unspecified
H70|Mastoiditis and related conditions
H70.0|Acute mastoiditis
H70.1|Chronic mastoiditis
H70.2|Petrositis
H70.8|Other mastoiditis and related conditions
H70.9|Mastoiditis, unspecified
H71|Cholesteatoma of middle ear
H72|Perforation of tympanic membrane
H72.0|Central perforation of tympanic membrane
H72.1|Attic perforation of tympanic membrane
H72.2|Other marginal perforations of tympanic membrane
H72.8|Other perforations of tympanic membrane
H72.9|Perforation of tympanic membrane, unspecified
H73|Other disorders of tympanic membrane
H73.0|Acute myringitis
H73.1|Chronic myringitis
H73.8|Other specified disorders of tympanic membrane
H73.9|Disorder of tympanic membrane, unspecified
H74|Other disorders of middle ear and mastoid
H74.0|Tympanosclerosis
H74.1|Adhesive middle ear disease
H74.2|Discontinuity and dislocation of ear ossicles
H74.3|Other acquired abnormalities of ear ossicles
H74.4|Polyp of middle ear
H74.8|Other specified disorders of middle ear and mastoid
H74.9|Disorder of middle ear and mastoid, unspecified
H75|Other disorders of middle ear and mastoid in diseases classified elsewhere
H75.0|Mastoiditis in infectious and parasitic diseases classified elsewhere
H75.8|Other spec disorder of middle ear and mastoid in diseases classified elsewhere
H80|Otosclerosis
H80.0|Otosclerosis involving oval window, nonobliterative
H80.1|Otosclerosis involving oval window, obliterative
H80.2|Cochlear otosclerosis
H80.8|Other otosclerosis
H80.9|Otosclerosis, unspecified
H81|Disorders of vestibular function
H81.0|Meniere's disease
H81.1|Benign paroxysmal vertigo
H81.2|Vestibular neuronitis
H81.3|Other peripheral vertigo
H81.4|Vertigo of central origin
H81.8|Other disorders of vestibular function
H81.9|Disorder of vestibular function, unspecified
H82|Vertiginous syndromes in diseases classified elsewhere
H83|Other diseases of inner ear
H83.0|Labyrinthitis
H83.1|Labyrinthine fistula
H83.2|Labyrinthine dysfunction
H83.3|Noise effects on inner ear
H83.8|Other specified diseases of inner ear
H83.9|Disease of inner ear, unspecified
H90|Conductive and sensorineural hearing loss
H90.0|Conductive hearing loss, bilateral
H90.1|Conduct hearing loss, unilateral with unrestricted hearing on the contralateral side
H90.2|Conductive hearing loss, unspecified
H90.3|Sensorineural hearing loss, bilateral
H90.4|Sensorineural hear loss unilat unrestricted hearing contralateral side
H90.5|Sensorineural hearing loss, unspecified
H90.6|Mixed conductive and sensorineural hearing loss, bilateral
H90.7|Mix conductive and sensorineural hearing loss, unilateral unrestricted hearing on the contralateral side
H90.8|Mixed conductive and sensorineural hearing loss, unspecified
H91|Other hearing loss
H91.0|Ototoxic hearing loss
H91.1|Presbycusis
H91.2|Sudden idiopathic hearing loss
H91.3|Deaf mutism, not elsewhere classified
H91.8|Other specified hearing loss
H91.9|Hearing loss, unspecified
H92|Otalgia and effusion of ear
H92.0|Otalgia
H92.1|Otorrhoea
H92.2|Otorrhagia
H93|Other disorders of ear, not elsewhere classified
H93.0|Degenerative and vascular disorders of ear
H93.1|Tinnitus
H93.2|Other abnormal auditory perceptions
H93.3|Disorders of acoustic nerve
H93.8|Other specified disorders of ear
H93.9|Disorder of ear, unspecified
H94|Other disorders of ear in diseases classified elsewhere
H94.0|Acoustic neuritis in infectious and parasitic diseases classified elsewhere
H94.8|Other specified disorders of ear in diseases classified elsewhere
H95|Postprocedural disorders of ear and mastoid process, not elsewhere classified
H95.0|Recurrent cholesteatoma of postmastoidectomy cavity
H95.1|Other disorders following mastoidectomy
H95.8|Other postprocedural disorders of ear and mastoid process
H95.9|Postprocedural disorder of ear and mastoid process, unspecified
I00|Rheumatic fever without mention of heart involvement
I01|Rheumatic fever with heart involvement
I01.0|Acute rheumatic pericarditis
I01.1|Acute rheumatic endocarditis
I01.2|Acute rheumatic myocarditis
I01.8|Other acute rheumatic heart disease
I01.9|Acute rheumatic heart disease, unspecified
I02|Rheumatic chorea
I02.0|Rheumatic chorea with heart involvement
I02.9|Rheumatic chorea without heart involvement
I05|Rheumatic mitral valve diseases
I05.0|Mitral stenosis
I05.1|Rheumatic mitral insufficiency
I05.2|Mitral stenosis with insufficiency
I05.8|Other mitral valve diseases
I05.9|Mitral valve disease, unspecified
I06|Rheumatic aortic valve diseases
I06.0|Rheumatic aortic stenosis
I06.1|Rheumatic aortic insufficiency
I06.2|Rheumatic aortic stenosis with insufficiency
I06.8|Other rheumatic aortic valve diseases
I06.9|Rheumatic aortic valve disease, unspecified
I07|Rheumatic tricuspid valve diseases
I07.0|Tricuspid stenosis
I07.1|Tricuspid insufficiency
I07.2|Tricuspid stenosis with insufficiency
I07.8|Other tricuspid valve diseases
I07.9|Tricuspid valve disease, unspecified
I08|Multiple valve diseases
I08.0|Disorders of both mitral and aortic valves
I08.1|Disorders of both mitral and tricuspid valves
I08.2|Disorders of both aortic and tricuspid valves
I08.3|Combined disorders of mitral, aortic and tricuspid valves
I08.8|Other multiple valve diseases
I08.9|Multiple valve disease, unspecified
I09|Other rheumatic heart diseases
I09.0|Rheumatic myocarditis
I09.1|Rheumatic diseases of endocardium, valve unspecified
I09.2|Chronic rheumatic pericarditis
I09.8|Other specified rheumatic heart diseases
I09.9|Rheumatic heart disease, unspecified
I10|Essential (primary) hypertension
I11|Hypertensive heart disease
I11.0|Hypertensive heart disease with (congestive) heart failure
I11.9|Hypertensive heart disease without (congestive) heart failure
I12|Hypertensive renal disease
I12.0|Hypertensive renal disease with renal failure
I12.9|Hypertensive renal disease without renal failure
I13|Hypertensive heart and renal disease
I13.0|Hypertens heart and renal dis with (congestive) heart failure
I13.1|Hypertensive heart and renal disease with renal failure
I13.2|Hyper heart and renal disease both (congestive) heart failure and renal failure
I13.9|Hypertensive heart and renal disease, unspecified
I15|Secondary hypertension
I15.0|Renovascular hypertension
I15.1|Hypertension secondary to other renal disorders
I15.2|Hypertension secondary to endocrine disorders
I15.8|Other secondary hypertension
I15.9|Secondary hypertension, unspecified
I20|Angina pectoris
I20.0|Unstable angina
I20.1|Angina pectoris with documented spasm
I20.8|Other forms of angina pectoris
I20.9|Angina pectoris, unspecified
I21|Acute myocardial infarction
I21.0|Acute transmural myocardial infarction of anterior wall
I21.1|Acute transmural myocardial infarction of inferior wall
I21.2|Acute transmural myocardial infarction of other sites
I21.3|Acute transmural myocardial infarction of unspecified site
I21.4|Acute subendocardial myocardial infarction
I21.9|Acute myocardial infarction, unspecified
I22|Subsequent myocardial infarction
I22.0|Subsequent myocardial infarction of anterior wall
I22.1|Subsequent myocardial infarction of inferior wall
I22.8|Subsequent myocardial infarction of other sites
I22.9|Subsequent myocardial infarction of unspecified site
I23|Certain current complications following acute myocardial infarction
I23.0|Haemopericardium as current complication following acute myocardial infarction
I23.1|Atrial septal defect as current complication following acute myocardial infarction
I23.2|Ventricular septal defect as current complication following acute myocardial infarction
I23.3|Rupture cardiac wall without haemopericardium as current complication following acute myocardial infarction
I23.4|Rupture chordae tendineae as current complication following acut myocardial infarction
I23.5|Rupture of papilary muscle as current complication following acute myocardial infarction
I23.6|Thrombosis of atrium, auricular appendage ventricle as current complication following acute myocardial infarction
I23.8|Oth current complications following acute myocardial infarction
I24|Other acute ischaemic heart diseases
I24.0|Coronary thrombosis not resulting in myocardial infarction
I24.1|Dressler's syndrome
I24.8|Other forms of acute ischaemic heart disease
I24.9|Acute ischaemic heart disease, unspecified
I25|Chronic ischaemic heart disease
I25.0|Atherosclerotic cardiovascular disease, so described
I25.1|Atherosclerotic heart disease
I25.2|Old myocardial infarction
I25.3|Aneurysm of heart
I25.4|Coronary artery aneurysm
I25.5|Ischaemic cardiomyopathy
I25.6|Silent myocardial ischaemia
I25.8|Other forms of chronic ischaemic heart disease
I25.9|Chronic ischaemic heart disease, unspecified
I26|Pulmonary embolism
I26.0|Pulmonary embolism with mention of acute cor pulmonale
I26.9|Pulmonary embolism without mention of acute cor pulmonale
I27|Other pulmonary heart diseases
I27.0|Primary pulmonary hypertension
I27.1|Kyphoscoliotic heart disease
I27.2|Other secondary pulmonary hypertension
I27.8|Other specified pulmonary heart diseases
I27.9|Pulmonary heart disease, unspecified
I28|Other diseases of pulmonary vessels
I28.0|Arteriovenous fistula of pulmonary vessels
I28.1|Aneurysm of pulmonary artery
I28.8|Other specified diseases of pulmonary vessels
I28.9|Disease of pulmonary vessels, unspecified
I30|Acute pericarditis
I30.0|Acute nonspecific idiopathic pericarditis
I30.1|Infective pericarditis
I30.8|Other forms of acute pericarditis
I30.9|Acute pericarditis, unspecified
I31|Other diseases of pericardium
I31.0|Chronic adhesive pericarditis
I31.1|Chronic constrictive pericarditis
I31.2|Haemopericardium, not elsewhere classified
I31.3|Pericardial effusion (noninflammatory)
I31.8|Other specified diseases of pericardium
I31.9|Disease of pericardium, unspecified
I32|Pericarditis in diseases classified elsewhere
I32.0|Pericarditis in bacterial diseases classified elsewhere
I32.1|Pericarditis in other infectious and parasitic diseases classified elsewhere
I32.8|Pericarditis in other diseases classified elsewhere
I33|Acute and subacute endocarditis
I33.0|Acute and subacute infective endocarditis
I33.9|Acute endocarditis, unspecified
I34|Nonrheumatic mitral valve disorders
I34.0|Mitral (valve) insufficiency
I34.1|Mitral (valve) prolapse
I34.2|Nonrheumatic mitral (valve) stenosis
I34.8|Other nonrheumatic mitral valve disorders
I34.9|Nonrheumatic mitral valve disorder, unspecified
I35|Nonrheumatic aortic valve disorders
I35.0|Aortic (valve) stenosis
I35.1|Aortic (valve) insufficiency
I35.2|Aortic (valve) stenosis with insufficiency
I35.8|Other aortic valve disorders
I35.9|Aortic valve disorder, unspecified
I36|Nonrheumatic tricuspid valve disorders
I36.0|Nonrheumatic tricuspid (valve) stenosis
I36.1|Nonrheumatic tricuspid (valve) insufficiency
I36.2|Nonrheumatic tricuspid (valve) stenosis with insufficiency
I36.8|Other nonrheumatic tricuspid valve disorders
I36.9|Nonrheumatic tricuspid valve disorder, unspecified
I37|Pulmonary valve disorders
I37.0|Pulmonary valve stenosis
I37.1|Pulmonary valve insufficiency
I37.2|Pulmonary valve stenosis with insufficiency
I37.8|Other pulmonary valve disorders
I37.9|Pulmonary valve disorder, unspecified
I38|Endocarditis, valve unspecified
I39|Endocarditis and heart valve disorders in diseases classified elsewhere
I39.0|Mitral valve disorders in diseases classified elsewhere
I39.1|Aortic valve disorders in diseases classified elsewhere
I39.2|Tricuspid valve disorders in diseases classified elsewhere
I39.3|Pulmonary valve disorders in diseases classified elsewhere
I39.4|Multiple valve disorders in diseases classified elsewhere
I39.8|Endocarditis, valve unspec, in diseases class elsewhere
I40|Acute myocarditis
I40.0|Infective myocarditis
I40.1|Isolated myocarditis
I40.8|Other acute myocarditis
I40.9|Acute myocarditis, unspecified
I41|Myocarditis in diseases classified elsewhere
I41.0|Myocarditis in bacterial diseases classified elsewhere
I41.1|Myocarditis in viral diseases classified elsewhere
I41.2|Myocarditis in other infectious and parasitic diseases classified elsewhere
I41.8|Myocarditis in other diseases classified elsewhere
I42|Cardiomyopathy
I42.0|Dilated cardiomyopathy
I42.1|Obstructive hypertrophic cardiomyopathy
I42.2|Other hypertrophic cardiomyopathy
I42.3|Endomyocardial (eosinophilic) disease
I42.4|Endocardial fibroelastosis
I42.5|Other restrictive cardiomyopathy
I42.6|Alcoholic cardiomyopathy
I42.7|Cardiomyopathy due to drugs and other external agents
I42.8|Other cardiomyopathies
I42.9|Cardiomyopathy, unspecified
I43|Cardiomyopathy in diseases classified elsewhere
I43.0|Cardiomyopathy in infectious & parasitic diseases classified elsewhere
I43.1|Cardiomyopathy in metabolic diseases
I43.2|Cardiomyopathy in nutritional diseases
I43.8|Cardiomyopathy in other diseases classified elsewhere
I44|Atrioventricular and left bundle-branch block
I44.0|Atrioventricular block, first degree
I44.1|Atrioventricular block, second degree
I44.2|Atrioventricular block, complete
I44.3|Other and unspecified atrioventricular block
I44.4|Left anterior fascicular block
I44.5|Left posterior fascicular block
I44.6|Other and unspecified fascicular block
I44.7|Left bundle-branch block, unspecified
I45|Other conduction disorders
I45.0|Right fascicular block
I45.1|Other and unspecified right bundle-branch block
I45.2|Bifascicular block
I45.3|Trifascicular block
I45.4|Nonspecific intraventricular block
I45.5|Other specified heart block
I45.6|Pre-excitation syndrome
I45.8|Other specified conduction disorders
I45.9|Conduction disorder, unspecified
I46|Cardiac arrest
I46.0|Cardiac arrest with successful resuscitation
I46.1|Sudden cardiac death, so described
I46.9|Cardiac arrest, unspecified
I47|Paroxysmal tachycardia
I47.0|Re-entry ventricular arrhythmia
I47.1|Supraventricular tachycardia
I47.2|Ventricular tachycardia
I47.9|Paroxysmal tachycardia, unspecified
I48|Atrial fibrillation and flutter
I49|Other cardiac arrhythmias
I49.0|Ventricular fibrillation and flutter
I49.1|Atrial premature depolarization
I49.2|Junctional premature depolarization
I49.3|Ventricular premature depolarization
I49.4|Other and unspecified premature depolarization
I49.5|Sick sinus syndrome
I49.8|Other specified cardiac arrhythmias
I49.9|Cardiac arrhythmia, unspecified
I50|Heart failure
I50.0|Congestive heart failure
I50.1|Left ventricular failure
I50.9|Heart failure, unspecified
I51|Complications and ill-defined descriptions of heart disease
I51.0|Cardiac septal defect, acquired
I51.1|Rupture of chordae tendineae, not elsewhere classified
I51.2|Rupture of papillary muscle, not elsewhere classified
I51.3|Intracardiac thrombosis, not elsewhere classified
I51.4|Myocarditis, unspecified
I51.5|Myocardial degeneration
I51.6|Cardiovascular disease, unspecified
I51.7|Cardiomegaly
I51.8|Other ill-defined heart diseases
I51.9|Heart disease, unspecified
I52|Other heart disorders in diseases classified elsewhere
I52.0|Other heart disorders in bacterial diseases classified elsewhere
I52.1|Oth heart disorders in oth infectious and parasitic disease classified elsewhere
I52.8|Other heart disorders in other diseases classified elsewhere
I60|Subarachnoid haemorrhage
I60.0|Subarachnoid haemorrhage from carotid siphon and bifurcation
I60.1|Subarachnoid haemorrhage from middle cerebral artery
I60.2|Subarachnoid haemorrhage from anterior communicating artery
I60.3|Subarachnoid haemorrhage from posterior communicating artery
I60.4|Subarachnoid haemorrhage from basilar artery
I60.5|Subarachnoid haemorrhage from vertebral artery
I60.6|Subarachnoid haemorrhage from other intracranial arteries
I60.7|Subarachnoid haemorrhage from intracranial artery, unspecified
I60.8|Other subarachnoid haemorrhage
I60.9|Subarachnoid haemorrhage, unspecified
I61|Intracerebral haemorrhage
I61.0|Intracerebral haemorrhage in hemisphere, subcortical
I61.1|Intracerebral haemorrhage in hemisphere, cortical
I61.2|Intracerebral haemorrhage in hemisphere, unspecified
I61.3|Intracerebral haemorrhage in brain stem
I61.4|Intracerebral haemorrhage in cerebellum
I61.5|Intracerebral haemorrhage, intraventricular
I61.6|Intracerebral haemorrhage, multiple localized
I61.8|Other intracerebral haemorrhage
I61.9|Intracerebral haemorrhage, unspecified
I62|Other nontraumatic intracranial haemorrhage
I62.0|Subdural haemorrhage (acute)(nontraumatic)
I62.1|Nontraumatic extradural haemorrhage
I62.9|Intracranial haemorrhage (nontraumatic), unspecified
I63|Cerebral infarction
I63.0|Cerebral infarct due to thrombosis of precerebral arteries
I63.1|Cerebral infarction due to embolism of precerebral arteries
I63.2|Cerebral infarction due unspecified occlusion or stenosis precerebral arteries
I63.3|Cerebral infarction due to thrombosis of cerebral arteries
I63.4|Cerebral infarction due to embolism of cerebral arteries
I63.5|Cerebral infarction due unspecified occlusion or stenos cerebrl arteries
I63.6|Cerebral infarction due cerebral venous thrombosis, nonpyogenic
I63.8|Other cerebral infarction
I63.9|Cerebral infarction, unspecified
I64|Stroke, not specified as haemorrhage or infarction
I65|Occlusion and stenosis of precerebral arteries, not resulting in cerebral infarction
I65.0|Occlusion and stenosis of vertebral artery
I65.1|Occlusion and stenosis of basilar artery
I65.2|Occlusion and stenosis of carotid artery
I65.3|Occlusion and stenosis of multip and bilat precerebral arteries
I65.8|Occlusion and stenosis of other precerebral artery
I65.9|Occlusion and stenosis of unspecified precerebral artery
I66|Occlusion and stenosis of cerebral arteries, not resulting in cerebral infarction
I66.0|Occlusion and stenosis of middle cerebral artery
I66.1|Occlusion and stenosis of anterior cerebral artery
I66.2|Occlusion and stenosis of posterior cerebral artery
I66.3|Occlusion and stenosis of cerebellar arteries
I66.4|Occlusion and stenosis of multiple and bilat cerebral arts
I66.8|Occlusion and stenosis of other cerebral artery
I66.9|Occlusion and stenosis of unspecified cerebral artery
I67|Other cerebrovascular diseases
I67.0|Dissection of cerebral arteries, nonruptured
I67.1|Cerebral aneurysm, nonruptured
I67.2|Cerebral atherosclerosis
I67.3|Progressive vascular leukoencephalopathy
I67.4|Hypertensive encephalopathy
I67.5|Moyamoya disease
I67.6|Nonpyogenic thrombosis of intracranial venous system
I67.7|Cerebral arteritis, not elsewhere classified
I67.8|Other specified cerebrovascular diseases
I67.9|Cerebrovascular disease, unspecified
I68|Cerebrovascular disorders in diseases classified elsewhere
I68.0|Cerebral amyloid angiopathy
I68.1|Cerebral arteritis in infectious & parasitic diseases classified elsewhere
I68.2|Cerebral arteritis in other diseases classified elsewhere
I68.8|Other cerebrovascular disorders in diseases classified elsewhere
I69|Sequelae of cerebrovascular disease
I69.0|Sequelae of subarachnoid haemorrhage
I69.1|Sequelae of intracerebral haemorrhage
I69.2|Sequelae of other nontraumatic intracranial haemorrhage
I69.3|Sequelae of cerebral infarction
I69.4|Sequelae of stroke, not specified as haemorrhage or infarction
I69.8|Sequelae of other and unspecified cerebrovascular diseases
I70|Atherosclerosis
I70.0|Atherosclerosis of aorta
I70.1|Atherosclerosis of renal artery
I70.2|Atherosclerosis of arteries of extremities
I70.8|Atherosclerosis of other arteries
I70.9|Generalized and unspecified atherosclerosis
I71|Aortic aneurysm and dissection
I71.0|Dissection of aorta [any part]
I71.1|Thoracic aortic aneurysm, ruptured
I71.2|Thoracic aortic aneurysm, without mention of rupture
I71.3|Abdominal aortic aneurysm, ruptured
I71.4|Abdominal aortic aneurysm, without mention of rupture
I71.5|Thoracoabdominal aortic aneurysm, ruptured
I71.6|Thoracoabdominal aortic aneurysm, without mention of rupture
I71.8|Aortic aneurysm of unspecified site, ruptured
I71.9|Aortic aneurysm of unspecified site, without mention of rupture
I72|Other aneurysm and dissection
I72.0|Aneurysm of carotid artery
I72.1|Aneurysm of artery of upper extremity
I72.2|Aneurysm of renal artery
I72.3|Aneurysm of iliac artery
I72.4|Aneurysm of artery of lower extremity
I72.5|Aneurysm and dissection of other precerebral arteries
I72.8|Aneurysm of other specified arteries
I72.9|Aneurysm of unspecified site
I73|Other peripheral vascular diseases
I73.0|Raynaud's syndrome
I73.1|Thromboangiitis obliterans [buerger]
I73.8|Other specified peripheral vascular diseases
I73.9|Peripheral vascular disease, unspecified
I74|Arterial embolism and thrombosis
I74.0|Embolism and thrombosis of abdominal aorta
I74.1|Embolism and thrombosis of other and unspecified parts of aorta
I74.2|Embolism and thrombosis of arteries of upper extremities
I74.3|Embolism and thrombosis of arteries of lower extremities
I74.4|Embolism and thrombosis of arteries of extremities, unspecified
I74.5|Embolism and thrombosis of iliac artery
I74.8|Embolism and thrombosis of other arteries
I74.9|Embolism and thrombosis of unspecified artery
I77|Other disorders of arteries and arterioles
I77.0|Arteriovenous fistula, acquired
I77.1|Stricture of artery
I77.2|Rupture of artery
I77.3|Arterial fibromuscular dysplasia
I77.4|Coeliac artery compression syndrome
I77.5|Necrosis of artery
I77.6|Arteritis, unspecified
I77.8|Other specified disorders of arteries and arterioles
I77.9|Disorder of arteries and arterioles, unspecified
I78|Diseases of capillaries
I78.0|Hereditary haemorrhagic telangiectasia
I78.1|Naevus, non-neoplastic
I78.8|Other diseases of capillaries
I78.9|Disease of capillaries, unspecified
I79|Disorders of arteries, arterioles and capillaries in diseases classified elsewhere
I79.0|Aneurysm of aorta in diseases classified elsewhere
I79.1|Aortitis in diseases classified elsewhere
I79.2|Peripheral angiopathy in diseases classified elsewhere
I79.8|Oth disord arteries, arterioles & capillaries in diseases classified elsewhere
I80|Phlebitis and thrombophlebitis
I80.0|Phlebitis and thrombophlebitis superficial vessels low extremities
I80.1|Phlebitis and thrombophlebitis of femoral vein
I80.2|Phlebitis and thrombophlebitis oth deep vessels low extremities
I80.3|Phlebitis and thrombophlebitis of lower extremities, unspecified
I80.8|Phlebitis and thrombophlebitis of other sites
I80.9|Phlebitis and thrombophlebitis of unspecified site
I81|Portal vein thrombosis
I82|Other venous embolism and thrombosis
I82.0|Budd-chiari syndrome
I82.1|Thrombophlebitis migrans
I82.2|Embolism and thrombosis of vena cava
I82.3|Embolism and thrombosis of renal vein
I82.8|Embolism and thrombosis of other specified veins
I82.9|Embolism and thrombosis of unspecified vein
I83|Varicose veins of lower extremities
I83.0|Varicose veins of lower extremities with ulcer
I83.1|Varicose veins of lower extremities with inflammation
I83.2|Varicose veins low extremities with both ulcer and inflammation
I83.9|Varicose veins lower extremities without ulcer or inflammation
I84|Haemorrhoids
I84.0|Internal thrombosed haemorrhoids
I84.1|Internal haemorrhoids with other complications
I84.2|Internal haemorrhoids without complication
I84.3|External thrombosed haemorrhoids
I84.4|External haemorrhoids with other complications
I84.5|External haemorrhoids without complication
I84.6|Residual haemorrhoidal skin tags
I84.7|Unspecified thrombosed haemorrhoids
I84.8|Unspecified haemorrhoids with other complications
I84.9|Unspecified haemorrhoids without complication
I85|Oesophageal varices
I85.0|Oesophageal varices with bleeding
I85.9|Oesophageal varices without bleeding
I86|Varicose veins of other sites
I86.0|Sublingual varices
I86.1|Scrotal varices
I86.2|Pelvic varices
I86.3|Vulval varices
I86.4|Gastric varices
I86.8|Varicose veins of other specified sites
I87|Other disorders of veins
I87.0|Postphlebitic syndrome
I87.1|Compression of vein
I87.2|Venous insufficiency (chronic)(peripheral)
I87.8|Other specified disorders of veins
I87.9|Disorder of vein, unspecified
I88|Nonspecific lymphadenitis
I88.0|Nonspecific mesenteric lymphadenitis
I88.1|Chronic lymphadenitis, except mesenteric
I88.8|Other nonspecific lymphadenitis
I88.9|Nonspecific lymphadenitis, unspecified
I89|Other noninfective disorders of lymphatic vessels and lymph nodes
I89.0|Lymphoedema, not elsewhere classified
I89.1|Lymphangitis
I89.8|Other specified noninfective disorders lymphatic vessels and lymph nodes
I89.9|Noninfective disorder lymphatic vessels and lymph nodes, unspecified
I95|Hypotension
I95.0|Idiopathic hypotension
I95.1|Orthostatic hypotension
I95.2|Hypotension due to drugs
I95.8|Other hypotension
I95.9|Hypotension, unspecified
I97|Postprocedural disorders of circulatory system, not elsewhere classified
I97.0|Postcardiotomy syndrome
I97.1|Other functional disturbances following cardiac surgery
I97.2|Postmastectomy lymphoedema syndrome
I97.8|Other postprocedural disorders of circulatory system , not elsewhere classified
I97.9|Postprocedural disorder of circulatory system, unspecified
I98|Other disorders of circulatory system in diseases classified elsewhere
I98.0|Cardiovascular syphilis
I98.1|Cardiovascular disorder other infectious and parasitic diseases classified elsewhere
I98.2|Oesophageal varices in diseases classified elsewhere
I98.3|Oesophageal varices with bleeding in diseases classified elsewhere
I98.8|Other specified disorders of circulatory system in diseases classified elsewhere
I99|Other and unspecified disorders of circulatory system
J00|Acute nasopharyngitis [common cold]
J01|Acute sinusitis
J01.0|Acute maxillary sinusitis
J01.1|Acute frontal sinusitis
J01.2|Acute ethmoidal sinusitis
J01.3|Acute sphenoidal sinusitis
J01.4|Acute pansinusitis
J01.8|Other acute sinusitis
J01.9|Acute sinusitis, unspecified
J02|Acute pharyngitis
J02.0|Streptococcal pharyngitis
J02.8|Acute pharyngitis due to other specified organisms
J02.9|Acute pharyngitis, unspecified
J03|Acute tonsillitis
J03.0|Streptococcal tonsillitis
J03.8|Acute tonsillitis due to other specified organisms
J03.9|Acute tonsillitis, unspecified
J04|Acute laryngitis and tracheitis
J04.0|Acute laryngitis
J04.1|Acute tracheitis
J04.2|Acute laryngotracheitis
J05|Acute obstructive laryngitis [croup] and epiglottitis
J05.0|Acute obstructive laryngitis [croup]
J05.1|Acute epiglottitis
J06|Acute upper respiratory infections of multiple and unspecified sites
J06.0|Acute laryngopharyngitis
J06.8|Other acute upper respiratory infections of multiple sites
J06.9|Acute upper respiratory infection, unspecified
J09|Influenza due to identified avian infliuenza virus
J10|Influenza due to other identified influenza virus
J10.0|Influenza with pneumonia, influenza virus identified
J10.1|Influenza with other respiratory manifestations, other influenza virus identified
J10.8|Influenza with other manifestations, other influenza virus identified
J11|Influenza, virus not identified
J11.0|Influenza with pneumonia, virus not identified
J11.1|Influenza with other respiratory manifestations virus not identified
J11.8|Influenza with other manifestations, virus not identified
J12|Viral pneumonia, not elsewhere classified
J12.0|Adenoviral pneumonia
J12.1|Respiratory syncytial virus pneumonia
J12.2|Parainfluenza virus pneumonia
J12.3|Human metapneumovirus pneumonia
J12.8|Other viral pneumonia
J12.9|Viral pneumonia, unspecified
J13|Pneumonia due to streptococcus pneumoniae
J14|Pneumonia due to haemophilus influenzae
J15|Bacterial pneumonia, not elsewhere classified
J15.0|Pneumonia due to klebsiella pneumoniae
J15.1|Pneumonia due to pseudomonas
J15.2|Pneumonia due to staphylococcus
J15.3|Pneumonia due to streptococcus, group B
J15.4|Pneumonia due to other streptococci
J15.5|Pneumonia due to escherichia coli
J15.6|Pneumonia due to other aerobic gram-negative bacteria
J15.7|Pneumonia due to mycoplasma pneumoniae
J15.8|Other bacterial pneumonia
J15.9|Bacterial pneumonia, unspecified
J16|Pneumonia due to other infectious organisms, not elsewhere classified
J16.0|Chlamydial pneumonia
J16.8|Pneumonia due to other specified infectious organisms
J17|Pneumonia in diseases classified elsewhere
J17.0|Pneumonia in bacterial diseases classified elsewhere
J17.1|Pneumonia in viral diseases classified elsewhere
J17.2|Pneumonia in mycoses
J17.3|Pneumonia in parasitic diseases
J17.8|Pneumonia in other diseases classified elsewhere
J18|Pneumonia, organism unspecified
J18.0|Bronchopneumonia, unspecified
J18.1|Lobar pneumonia, unspecified
J18.2|Hypostatic pneumonia, unspecified
J18.8|Other pneumonia, organism unspecified
J18.9|Pneumonia, unspecified
J20|Acute bronchitis
J20.0|Acute bronchitis due to mycoplasma pneumoniae
J20.1|Acute bronchitis due to haemophilus influenzae
J20.2|Acute bronchitis due to streptococcus
J20.3|Acute bronchitis due to coxsackievirus
J20.4|Acute bronchitis due to parainfluenza virus
J20.5|Acute bronchitis due to respiratory syncytial virus
J20.6|Acute bronchitis due to rhinovirus
J20.7|Acute bronchitis due to echovirus
J20.8|Acute bronchitis due to other specified organisms
J20.9|Acute bronchitis, unspecified
J21|Acute bronchiolitis
J21.0|Acute bronchiolitis due to respiratory syncytial virus
J21.1|Acute bronchiolitis due to human metapneumovirus
J21.8|Acute bronchiolitis due to other specified organisms
J21.9|Acute bronchiolitis, unspecified
J22|Unspecified acute lower respiratory infection
J30|Vasomotor and allergic rhinitis
J30.0|Vasomotor rhinitis
J30.1|Allergic rhinitis due to pollen
J30.2|Other seasonal allergic rhinitis
J30.3|Other allergic rhinitis
J30.4|Allergic rhinitis, unspecified
J31|Chronic rhinitis, nasopharyngitis and pharyngitis
J31.0|Chronic rhinitis
J31.1|Chronic nasopharyngitis
J31.2|Chronic pharyngitis
J32|Chronic sinusitis
J32.0|Chronic maxillary sinusitis
J32.1|Chronic frontal sinusitis
J32.2|Chronic ethmoidal sinusitis
J32.3|Chronic sphenoidal sinusitis
J32.4|Chronic pansinusitis
J32.8|Other chronic sinusitis
J32.9|Chronic sinusitis, unspecified
J33|Nasal polyp
J33.0|Polyp of nasal cavity
J33.1|Polypoid sinus degeneration
J33.8|Other polyp of sinus
J33.9|Nasal polyp, unspecified
J34|Other disorders of nose and nasal sinuses
J34.0|Abscess, furuncle and carbuncle of nose
J34.1|Cyst and mucocele of nose and nasal sinus
J34.2|Deviated nasal septum
J34.3|Hypertrophy of nasal turbinates
J34.8|Other specified disorders of nose and nasal sinuses
J35|Chronic diseases of tonsils and adenoids
J35.0|Chronic tonsillitis
J35.1|Hypertrophy of tonsils
J35.2|Hypertrophy of adenoids
J35.3|Hypertrophy of tonsils with hypertrophy of adenoids
J35.8|Other chronic diseases of tonsils and adenoids
J35.9|Chronic disease of tonsils and adenoids, unspecified
J36|Peritonsillar abscess
J37|Chronic laryngitis and laryngotracheitis
J37.0|Chronic laryngitis
J37.1|Chronic laryngotracheitis
J38|Diseases of vocal cords and larynx, not elsewhere classified
J38.0|Paralysis of vocal cords and larynx
J38.1|Polyp of vocal cord and larynx
J38.2|Nodules of vocal cords
J38.3|Other diseases of vocal cords
J38.4|Oedema of larynx
J38.5|Laryngeal spasm
J38.6|Stenosis of larynx
J38.7|Other diseases of larynx
J39|Other diseases of upper respiratory tract
J39.0|Retropharyngeal and parapharyngeal abscess
J39.1|Other abscess of pharynx
J39.2|Other diseases of pharynx
J39.3|Upper respiratory tract hypersensitivity reaction, site unspecified
J39.8|Other specified diseases of upper respiratory tract
J39.9|Disease of upper respiratory tract, unspecified
J40|Bronchitis, not specified as acute or chronic
J41|Simple and mucopurulent chronic bronchitis
J41.0|Simple chronic bronchitis
J41.1|Mucopurulent chronic bronchitis
J41.8|Mixed simple and mucopurulent chronic bronchitis
J42|Unspecified chronic bronchitis
J43|Emphysema
J43.0|Macleod's syndrome
J43.1|Panlobular emphysema
J43.2|Centrilobular emphysema
J43.8|Other emphysema
J43.9|Emphysema, unspecified
J44|Other chronic obstructive pulmonary disease
J44.0|Chronic obstructive pulmonary disease with acute lower respiratory infection
J44.1|Chronic obstructive pulmonary disease with acute exacerbation, unspecified
J44.8|Other specified chronic obstructive pulmonary disease
J44.9|Chronic obstructive pulmonary disease, unspecified
J45|Asthma
J45.0|Predominantly allergic asthma
J45.1|Nonallergic asthma
J45.8|Mixed asthma
J45.9|Asthma, unspecified
J46|Status asthmaticus
J47|Bronchiectasis
J60|Coalworker's pneumoconiosis
J61|Pneumoconiosis due to asbestos and other mineral fibres
J62|Pneumoconiosis due to dust containing silica
J62.0|Pneumoconiosis due to talc dust
J62.8|Pneumoconiosis due to other dust containing silica
J63|Pneumoconiosis due to other inorganic dusts
J63.0|Aluminosis (of lung)
J63.1|Bauxite fibrosis (of lung)
J63.2|Berylliosis
J63.3|Graphite fibrosis (of lung)
J63.4|Siderosis
J63.5|Stannosis
J63.8|Pneumoconiosis due to other specified inorganic dusts
J64|Unspecified pneumoconiosis
J65|Pneumoconiosis associated with tuberculosis
J66|Airway disease due to specific organic dust
J66.0|Byssinosis
J66.1|Flax-dresser's disease
J66.2|Cannabinosis
J66.8|Airway disease due to other specific organic dusts
J67|Hypersensitivity pneumonitis due to organic dust
J67.0|Farmer's lung
J67.1|Bagassosis
J67.2|Bird fancier's lung
J67.3|Suberosis
J67.4|Maltworker's lung
J67.5|Mushroom-worker's lung
J67.6|Maple-bark-stripper's lung
J67.7|Air-conditioner and humidifier lung
J67.8|Hypersensitivity pneumonitis due to other organic dusts
J67.9|Hypersensitivity pneumonitis due to unspecified organic dust
J68|Respiratory conditions due to inhalation of chemicals, gases, fumes and vapours
J68.0|Bronchitis & pneumonitis due chemicals, gases fumes & vapours
J68.1|Acute pulmon'y oedema due chemicals, gases fumes & vapours
J68.2|Upper respiratory inflammation due to chemicals gases, fumes and vapour not elsewhere classified
J68.3|Other acute and subacute respiratory conditions due to chemicals, gases, fumes & vapours
J68.4|Chronic respiratory conditions due chemicals, gases, fumes and vapours
J68.8|Other respiratory conditions due chemicals, gases fumes & vapours
J68.9|Unspecified respiratory conditions due chemicals, gases fumes & vapours
J69|Pneumonitis due to solids and liquids
J69.0|Pneumonitis due to food and vomit
J69.1|Pneumonitis due to oils and essences
J69.8|Pneumonitis due to other solids and liquids
J70|Respiratory conditions due to other external agents
J70.0|Acute pulmonary manifestations due to radiation
J70.1|Chronic and other pulmonary manifestations due to radiation
J70.2|Acute drug-induced interstitial lung disorders
J70.3|Chronic drug-induced interstitial lung disorders
J70.4|Drug-induced interstitial lung disorders, unspecified
J70.8|Respiratory conditions due to other specified external agents
J70.9|Respiratory conditions due to unspecified external agent
J80|Adult respiratory distress syndrome
J81|Pulmonary oedema
J82|Pulmonary eosinophilia, not elsewhere classified
J84|Other interstitial pulmonary diseases
J84.0|Alveolar and parietoalveolar conditions
J84.1|Other interstitial pulmonary diseases with fibrosis
J84.8|Other specified interstitial pulmonary diseases
J84.9|Interstitial pulmonary disease, unspecified
J85|Abscess of lung and mediastinum
J85.0|Gangrene and necrosis of lung
J85.1|Abscess of lung with pneumonia
J85.2|Abscess of lung without pneumonia
J85.3|Abscess of mediastinum
J86|Pyothorax
J86.0|Pyothorax with fistula
J86.9|Pyothorax without fistula
J90|Pleural effusion, not elsewhere classified
J91|Pleural effusion in conditions classified elsewhere
J92|Pleural plaque
J92.0|Pleural plaque with presence of asbestos
J92.9|Pleural plaque without asbestos
J93|Pneumothorax
J93.0|Spontaneous tension pneumothorax
J93.1|Other spontaneous pneumothorax
J93.8|Other pneumothorax
J93.9|Pneumothorax, unspecified
J94|Other pleural conditions
J94.0|Chylous effusion
J94.1|Fibrothorax
J94.2|Haemothorax
J94.8|Other specified pleural conditions
J94.9|Pleural condition, unspecified
J95|Postprocedural respiratory disorders, not elsewhere classified
J95.0|Tracheostomy malfunction
J95.1|Acute pulmonary insufficiency following thoracic surgery
J95.2|Acute pulmonary insufficiency following nonthoracic surgery
J95.3|Chronic pulmonary insufficiency following surgery
J95.4|Mendelson's syndrome
J95.5|Postprocedural subglottic stenosis
J95.8|Other postprocedural respiratory disorders
J95.9|Postprocedural respiratory disorder, unspecified
J96|Respiratory failure, not elsewhere classified
J96.0|Acute respiratory failure
J96.1|Chronic respiratory failure
J96.9|Respiratory failure, unspecified
J98|Other respiratory disorders
J98.0|Diseases of bronchus, not elsewhere classified
J98.1|Pulmonary collapse
J98.2|Interstitial emphysema
J98.3|Compensatory emphysema
J98.4|Other disorders of lung
J98.5|Diseases of mediastinum, not elsewhere classified
J98.6|Disorders of diaphragm
J98.8|Other specified respiratory disorders
J98.9|Respiratory disorder, unspecified
J99|Respiratory disorders in diseases classified elsewhere
J99.0|Rheumatoid lung disease
J99.1|Resp disorders in other diffuse connective tissue disorders
J99.8|Respiratory disorders in other diseases classified elsewhere
K00|Disorders of tooth development and eruption
K00.0|Anodontia
K00.1|Supernumerary teeth
K00.2|Abnormalities of size and form of teeth
K00.3|Mottled teeth
K00.4|Disturbances in tooth formation
K00.5|Hereditary disturbances in tooth structure nec
K00.6|Disturbances in tooth eruption
K00.7|Teething syndrome
K00.8|Other disorders of tooth development
K00.9|Disorder of tooth development, unspecified
K01|Embedded and impacted teeth
K01.0|Embedded teeth
K01.1|Impacted teeth
K02|Dental caries
K02.0|Caries limited to enamel
K02.1|Caries of dentine
K02.2|Caries of cementum
K02.3|Arrested dental caries
K02.4|Odontoclasia
K02.8|Other dental caries
K02.9|Dental caries, unspecified
K03|Other diseases of hard tissues of teeth
K03.0|Excessive attrition of teeth
K03.1|Abrasion of teeth
K03.2|Erosion of teeth
K03.3|Pathological resorption of teeth
K03.4|Hypercementosis
K03.5|Ankylosis of teeth
K03.6|Deposits [accretions] on teeth
K03.7|Posteruptive colour changes of dental hard tissues
K03.8|Other specified diseases of hard tissues of teeth
K03.9|Disease of hard tissues of teeth, unspecified
K04|Diseases of pulp and periapical tissues
K04.0|Pulpitis
K04.1|Necrosis of pulp
K04.2|Pulp degeneration
K04.3|Abnormal hard tissue formation in pulp
K04.4|Acute apical periodontitis of pulpal origin
K04.5|Chronic apical periodontitis
K04.6|Periapical abscess with sinus
K04.7|Periapical abscess without sinus
K04.8|Radicular cyst
K04.9|Other and unspec diseases of pulp and periapical tissues
K05|Gingivitis and periodontal diseases
K05.0|Acute gingivitis
K05.1|Chronic gingivitis
K05.2|Acute periodontitis
K05.3|Chronic periodontitis
K05.4|Periodontosis
K05.5|Other periodontal diseases
K05.6|Periodontal disease, unspecified
K06|Other disorders of gingiva and edentulous alveolar ridge
K06.0|Gingival recession
K06.1|Gingival enlargement
K06.2|Gingival and edentulous alveolar ridge les assoc with traum
K06.8|Other specified disorder of gingiva and edentulous alveolar ridge
K06.9|Disorder of gingiva and edentulous alveolar ridge, unspec act
K07|Dentofacial anomalies [including malocclusion]
K07.0|Major anomalies of jaw size
K07.1|Anomalies of jaw-cranial base relationship
K07.2|Anomalies of dental arch relationship
K07.3|Anomalies of tooth position
K07.4|Malocclusion, unspecified
K07.5|Dentofacial functional abnormalities
K07.6|Temporomandibular joint disorders
K07.8|Other dentofacial anomalies
K07.9|Dentofacial anomaly, unspecified
K08|Other disorders of teeth and supporting structures
K08.0|Exfoliation of teeth due to systemic causes
K08.1|Loss of teeth accident extraction or local periodontal dis
K08.2|Atrophy of edentulous alveolar ridge
K08.3|Retained dental root
K08.8|Other specified disorders of teeth and supporting structures
K08.9|Disorder of teeth and supporting structures, unspecified
K09|Cysts of oral region, not elsewhere classified
K09.0|Developmental odontogenic cysts
K09.1|Developmental (nonodontogenic) cysts of oral region
K09.2|Other cysts of jaw
K09.8|Other cysts of oral region, not elsewhere classified
K09.9|Cyst of oral region, unspecified
K10|Other diseases of jaws
K10.0|Developmental disorders of jaws
K10.1|Giant cell granuloma, central
K10.2|Inflammatory conditions of jaws
K10.3|Alveolitis of jaws
K10.8|Other specified diseases of jaws
K10.9|Disease of jaws, unspecified
K11|Diseases of salivary glands
K11.0|Atrophy of salivary gland
K11.1|Hypertrophy of salivary gland
K11.2|Sialoadenitis
K11.3|Abscess of salivary gland
K11.4|Fistula of salivary gland
K11.5|Sialolithiasis
K11.6|Mucocele of salivary gland
K11.7|Disturbances of salivary secretion
K11.8|Other diseases of salivary glands
K11.9|Disease of salivary gland, unspecified
K12|Stomatitis and related lesions
K12.0|Recurrent oral aphthae
K12.1|Other forms of stomatitis
K12.2|Cellulitis and abscess of mouth
K12.3|Oral mucositis (ulcerative)
K13|Other diseases of lip and oral mucosa
K13.0|Diseases of lips
K13.1|Cheek and lip biting
K13.2|Leukoplakia and other disturbances of oral epithelium, including tongue
K13.3|Hairy leukoplakia
K13.4|Granuloma and granuloma-like lesions of oral mucosa
K13.5|Oral submucous fibrosis
K13.6|Irritative hyperplasia of oral mucosa
K13.7|Other and unspecified lesions of oral mucosa
K14|Diseases of tongue
K14.0|Glossitis
K14.1|Geographic tongue
K14.2|Median rhomboid glossitis
K14.3|Hypertrophy of tongue papillae
K14.4|Atrophy of tongue papillae
K14.5|Plicated tongue
K14.6|Glossodynia
K14.8|Other diseases of tongue
K14.9|Disease of tongue, unspecified
K20|Oesophagitis
K21|Gastro-oesophageal reflux disease
K21.0|Gastro-oesophageal reflux disease with oesophagitis
K21.9|Gastro-oesophageal reflux disease without oesophagitis
K22|Other diseases of oesophagus
K22.0|Achalasia of cardia
K22.1|Ulcer of oesophagus
K22.2|Oesophageal obstruction
K22.3|Perforation of oesophagus
K22.4|Dyskinesia of oesophagus
K22.5|Diverticulum of oesophagus, acquired
K22.6|Gastro-oesophageal laceration-haemorrhage syndrome
K22.7|Barrett's oesophagus
K22.8|Other specified diseases of oesophagus
K22.9|Disease of oesophagus, unspecified
K23|Disorders of oesophagus in diseases classified elsewhere
K23.0|Tuberculous oesophagitis
K23.1|Megaoesophagus in chagas' disease
K23.8|Disorders of oesophagus in other diseases ec
K25|Gastric ulcer
K25.0|Gastric ulcer, acute with haemorrhage
K25.1|Gastric ulcer, acute with perforation
K25.2|Gastric ulcer, acute with both haemorrhage and perforation
K25.3|Gastric ulcer, acute without haemorrhage or perforation
K25.4|Gastric ulcer, chronic or unspecified with haemorrhage
K25.5|Gastric ulcer, chronic or unspecified with perforation
K25.6|Gastric ulcer, chronic or unspecified with both haemorrhage and perforation
K25.7|Gastric ulcer, chronic without haemorrhage or perforation
K25.9|Gastric ulcer, unspec as acute or chronic w'out haemorrhage or perforation
K26|Duodenal ulcer
K26.0|Duodenal ulcer, acute with haemorrhage
K26.1|Duodenal ulcer, acute with perforation
K26.2|Duodenal ulcer, acute with both haemorrhage and perforation
K26.3|Duodenal ulcer, acute without haemorrhage or perforation
K26.4|Duodenal ulcer, chronic or unspecified with haemorrhage
K26.5|Duodenal ulcer, chronic or unspecified with perforation
K26.6|Chronic or unspecified with both haemorrhage and perforation
K26.7|Duodenal ulcer, chronic without haemorrhage or perforation
K26.9|Unspec as acute or chronic without haemorrhage or perforation
K27|Peptic ulcer, site unspecified
K27.0|Peptic ulcer, acute with haemorrhage
K27.1|Peptic ulcer, acute with perforation
K27.2|Peptic ulcer, acute with both haemorrhage and perforation
K27.3|Peptic ulcer, acute without haemorrhage or perforation
K27.4|Peptic ulcer, chronic or unspecified with haemorrhage
K27.5|Peptic ulcer, chronic or unspecified with perforation
K27.6|Peptic ulcer, chronic or unspecified with both haemorrhage and perforation
K27.7|Peptic ulcer, chronic without haemorrhage or perforation
K27.9|Peptic ulcer, unspec as acute or chronic without haemorrhage or perforation
K28|Gastrojejunal ulcer
K28.0|Gastrojejunal ulcer, acute with haemorrhage
K28.1|Gastrojejunal ulcer, acute with perforation
K28.2|Gastrojejunal ulcer, acute with both haemorrhage and perforation
K28.3|Gastrojejunal ulcer, acute without haemorrhage or perforation
K28.4|Gastrojejunal ulcer, chronic or unspecified with haemorrhage
K28.5|Gastrojejunal ulcer, chronic or unspecified with perforation
K28.6|Gastrojejunal ulcer, chronic or unspecified with both haemorrhage and perforation
K28.7|Gastrojejunal ulcer, chronic without haemorrhage or perforation
K28.9|Gastrojejunal ulcer, unspec as acute or chronic without haemorrhage or perforation
K29|Gastritis and duodenitis
K29.0|Acute haemorrhagic gastritis
K29.1|Other acute gastritis
K29.2|Alcoholic gastritis
K29.3|Chronic superficial gastritis
K29.4|Chronic atrophic gastritis
K29.5|Chronic gastritis, unspecified
K29.6|Other gastritis
K29.7|Gastritis, unspecified
K29.8|Duodenitis
K29.9|Gastroduodenitis, unspecified
K30|Dyspepsia
K31|Other diseases of stomach and duodenum
K31.0|Acute dilatation of stomach
K31.1|Adult hypertrophic pyloric stenosis
K31.2|Hourglass stricture and stenosis of stomach
K31.3|Pylorospasm, not elsewhere classified
K31.4|Gastric diverticulum
K31.5|Obstruction of duodenum
K31.6|Fistula of stomach and duodenum
K31.7|Polyp of stomach and duodenum
K31.8|Other specified diseases of stomach and duodenum
K31.9|Disease of stomach and duodenum, unspecified
K35|Acute appendicitis
K35.2|Acute appendicitis with generalized peritonitis
K35.3|Acute appendicitis with localized peritonitis
K35.8|Acute appendicitis, other and unspecified
K36|Other appendicitis
K37|Unspecified appendicitis
K38|Other diseases of appendix
K38.0|Hyperplasia of appendix
K38.1|Appendicular concretions
K38.2|Diverticulum of appendix
K38.3|Fistula of appendix
K38.8|Other specified diseases of appendix
K38.9|Disease of appendix, unspecified
K40|Inguinal hernia
K40.0|Bilateral inguinal hernia, with obstruction, without gangrene
K40.1|Bilateral inguinal hernia, with gangrene
K40.2|Bilateral inguinal hernia, without obstruction or gangrene
K40.3|Unilateral or unspecified inguinal hernia, with obstruction, without gangrene
K40.4|Unilateral or unspecified inguinal hernia, with gangrene
K40.9|Unilateral or unspecified inguinal hernia, without obstruction or gangrene
K41|Femoral hernia
K41.0|Bilateral femoral hernia, with obstruction, without gangrene
K41.1|Bilateral femoral hernia, with gangrene
K41.2|Bilateral femoral hernia, without obstruction or gangrene
K41.3|Unilateral or unspecified femoral hernia, with obstruction, without gangrene
K41.4|Unilateral or unspecified femoral hernia, with gangrene
K41.9|Unilateral or unspecified femoral hernia, without obstruction or gangrene
K42|Umbilical hernia
K42.0|Umbilical hernia with obstruction, without gangrene
K42.1|Umbilical hernia with gangrene
K42.9|Umbilical hernia without obstruction or gangrene
K43|Ventral hernia
K43.0|Ventral hernia with obstruction, without gangrene
K43.1|Ventral hernia with gangrene
K43.9|Ventral hernia without obstruction or gangrene
K44|Diaphragmatic hernia
K44.0|Diaphragmatic hernia with obstruction, without gangrene
K44.1|Diaphragmatic hernia with gangrene
K44.9|Diaphragmatic hernia without obstruction or gangrene
K45|Other abdominal hernia
K45.0|Other spec abdominal hernia with obstruct without gangrene
K45.1|Other specified abdominal hernia with gangrene
K45.8|Other specified abdominal hernia without obstruction or gangrene
K46|Unspecified abdominal hernia
K46.0|Unspecified abdominal hernia with obstruction without gangrene
K46.1|Unspecified abdominal hernia with gangrene
K46.9|Unspecified abdominal hernia without obstruction or gangrene
K50|Crohn disease [regional enteritis]
K50.0|Crohn's disease of small intestine
K50.1|Crohn's disease of large intestine
K50.8|Other crohn's disease
K50.9|Crohn's disease, unspecified
K51|Ulcerative colitis
K51.0|Ulcerative (chronic) enterocolitis
K51.1|Ulcerative (chronic) ileocolitis
K51.2|Ulcerative (chronic) proctitis
K51.3|Ulcerative (chronic) rectosigmoiditis
K51.4|Pseudopolyposis of colon
K51.5|Mucosal proctocolitis
K51.8|Other ulcerative colitis
K51.9|Ulcerative colitis, unspecified
K52|Other noninfective gastroenteritis and colitis
K52.0|Gastroenteritis and colitis due to radiation
K52.1|Toxic gastroenteritis and colitis
K52.2|Allergic and dietetic gastroenteritis and colitis
K52.3|Indeterminate colitis
K52.8|Other specified noninfective gastroenteritis and colitis
K52.9|Noninfective gastroenteritis and colitis, unspecified
K55|Vascular disorders of intestine
K55.0|Acute vascular disorders of intestine
K55.1|Chronic vascular disorders of intestine
K55.2|Angiodysplasia of colon
K55.8|Other vascular disorders of intestine
K55.9|Vascular disorder of intestine, unspecified
K56|Paralytic ileus and intestinal obstruction without hernia
K56.0|Paralytic ileus
K56.1|Intussusception
K56.2|Volvulus
K56.3|Gallstone ileus
K56.4|Other impaction of intestine
K56.5|Intestinal adhesions [bands] with obstruction
K56.6|Other and unspecified intestinal obstruction
K56.7|Ileus, unspecified
K57|Diverticular disease of intestine
K57.0|Diverticular disease of small intestine with perforation and abscess
K57.1|Diverticular disease of small intestine without perforation or abscess
K57.2|Diverticular disease of large intestine with perforation and abscess
K57.3|Diverticular disease of large intestine without perforation or abscess
K57.4|Diverticular disease of both small and large intestine with perforation and abscess
K57.5|Diverticular disease of both small and large intestine without perforation or abscess
K57.8|Diverticular disease of intestine, part unspecified, with perforation and abscess
K57.9|Diverticular disease of intestine, part unspecified, without perforation or abscess
K58|Irritable bowel syndrome
K58.0|Irritable bowel syndrome with diarrhoea
K58.9|Irritable bowel syndrome without diarrhoea
K59|Other functional intestinal disorders
K59.0|Constipation
K59.1|Functional diarrhoea
K59.2|Neurogenic bowel, not elsewhere classified
K59.3|Megacolon, not elsewhere classified
K59.4|Anal spasm
K59.8|Other specified functional intestinal disorders
K59.9|Functional intestinal disorder, unspecified
K60|Fissure and fistula of anal and rectal regions
K60.0|Acute anal fissure
K60.1|Chronic anal fissure
K60.2|Anal fissure, unspecified
K60.3|Anal fistula
K60.4|Rectal fistula
K60.5|Anorectal fistula
K61|Abscess of anal and rectal regions
K61.0|Anal abscess
K61.1|Rectal abscess
K61.2|Anorectal abscess
K61.3|Ischiorectal abscess
K61.4|Intrasphincteric abscess
K62|Other diseases of anus and rectum
K62.0|Anal polyp
K62.1|Rectal polyp
K62.2|Anal prolapse
K62.3|Rectal prolapse
K62.4|Stenosis of anus and rectum
K62.5|Haemorrhage of anus and rectum
K62.6|Ulcer of anus and rectum
K62.7|Radiation proctitis
K62.8|Other specified diseases of anus and rectum
K62.9|Disease of anus and rectum, unspecified
K63|Other diseases of intestine
K63.0|Abscess of intestine
K63.1|Perforation of intestine (nontraumatic)
K63.2|Fistula of intestine
K63.3|Ulcer of intestine
K63.4|Enteroptosis
K63.5|Polyp of colon
K63.8|Other specified diseases of intestine
K63.9|Disease of intestine, unspecified
K65|Peritonitis
K65.0|Acute peritonitis
K65.8|Other peritonitis
K65.9|Peritonitis, unspecified
K66|Other disorders of peritoneum
K66.0|Peritoneal adhesions
K66.1|Haemoperitoneum
K66.8|Other specified disorders of peritoneum
K66.9|Disorder of peritoneum, unspecified
K67|Disorders of peritoneum in infectious diseases classified elsewhere
K67.0|Chlamydial peritonitis
K67.1|Gonococcal peritonitis
K67.2|Syphilitic peritonitis
K67.3|Tuberculous peritonitis
K67.8|Other disorders of peritoneum in infectious diseases ec
K70|Alcoholic liver disease
K70.0|Alcoholic fatty liver
K70.1|Alcoholic hepatitis
K70.2|Alcoholic fibrosis and sclerosis of liver
K70.3|Alcoholic cirrhosis of liver
K70.4|Alcoholic hepatic failure
K70.9|Alcoholic liver disease, unspecified
K71|Toxic liver disease
K71.0|Toxic liver disease with cholestasis
K71.1|Toxic liver disease with hepatic necrosis
K71.2|Toxic liver disease with acute hepatitis
K71.3|Toxic liver disease with chronic persistent hepatitis
K71.4|Toxic liver disease with chronic lobular hepatitis
K71.5|Toxic liver disease with chronic active hepatitis
K71.6|Toxic liver disease with hepatitis, not elsewhere classified
K71.7|Toxic liver disease with fibrosis and cirrhosis of liver
K71.8|Toxic liver disease with other disorders of liver
K71.9|Toxic liver disease, unspecified
K72|Hepatic failure, not elsewhere classified
K72.0|Acute and subacute hepatic failure
K72.1|Chronic hepatic failure
K72.9|Hepatic failure, unspecified
K73|Chronic hepatitis, not elsewhere classified
K73.0|Chronic persistent hepatitis, not elsewhere classified
K73.1|Chronic lobular hepatitis, not elsewhere classified
K73.2|Chronic active hepatitis, not elsewhere classified
K73.8|Other chronic hepatitis, not elsewhere classified
K73.9|Chronic hepatitis, unspecified
K74|Fibrosis and cirrhosis of liver
K74.0|Hepatic fibrosis
K74.1|Hepatic sclerosis
K74.2|Hepatic fibrosis with hepatic sclerosis
K74.3|Primary biliary cirrhosis
K74.4|Secondary biliary cirrhosis
K74.5|Biliary cirrhosis, unspecified
K74.6|Other and unspecified cirrhosis of liver
K75|Other inflammatory liver diseases
K75.0|Abscess of liver
K75.1|Phlebitis of portal vein
K75.2|Nonspecific reactive hepatitis
K75.3|Granulomatous hepatitis, not elsewhere classified
K75.4|Autoimmune hepatitis
K75.8|Other specified inflammatory liver diseases
K75.9|Inflammatory liver disease, unspecified
K76|Other diseases of liver
K76.0|Fatty (change of) liver, not elsewhere classified
K76.1|Chronic passive congestion of liver
K76.2|Central haemorrhagic necrosis of liver
K76.3|Infarction of liver
K76.4|Peliosis hepatis
K76.5|Hepatic veno-occlusive disease
K76.6|Portal hypertension
K76.7|Hepatorenal syndrome
K76.8|Other specified diseases of liver
K76.9|Liver disease, unspecified
K77|Liver disorders in diseases classified elsewhere
K77.0|Liver disorders in infectious and parasitic diseases classified elsewhere
K77.8|Liver disorders in other diseases classified elsewhere
K80|Cholelithiasis
K80.0|Calculus of gallbladder with acute cholecystitis
K80.1|Calculus of gallbladder with other cholecystitis
K80.2|Calculus of gallbladder without cholecystitis
K80.3|Calculus of bile duct with cholangitis
K80.4|Calculus of bile duct with cholecystitis
K80.5|Calculus of bile duct without cholangitis or cholecystitis
K80.8|Other cholelithiasis
K81|Cholecystitis
K81.0|Acute cholecystitis
K81.1|Chronic cholecystitis
K81.8|Other cholecystitis
K81.9|Cholecystitis, unspecified
K82|Other diseases of gallbladder
K82.0|Obstruction of gallbladder
K82.1|Hydrops of gallbladder
K82.2|Perforation of gallbladder
K82.3|Fistula of gallbladder
K82.4|Cholesterolosis of gallbladder
K82.8|Other specified diseases of gallbladder
K82.9|Disease of gallbladder, unspecified
K83|Other diseases of biliary tract
K83.0|Cholangitis
K83.1|Obstruction of bile duct
K83.2|Perforation of bile duct
K83.3|Fistula of bile duct
K83.4|Spasm of sphincter of oddi
K83.5|Biliary cyst
K83.8|Other specified diseases of biliary tract
K83.9|Disease of biliary tract, unspecified
K85|Acute pancreatitis
K85.0|Idiopathic acute pancreatitis
K85.1|Biliary acute pancreatitis
K85.2|Alcohol-induced acute pancreatitis
K85.3|Drug-induced acute pancreatitis
K85.8|Other acute pancreatitis
K85.9|Acute pancreatitis, unspecified
K86|Other diseases of pancreas
K86.0|Alcohol-induced chronic pancreatitis
K86.1|Other chronic pancreatitis
K86.2|Cyst of pancreas
K86.3|Pseudocyst of pancreas
K86.8|Other specified diseases of pancreas
K86.9|Disease of pancreas, unspecified
K87|Disorders of gallbladder, biliary tract and pancreas in diseases classified elsewhere
K87.0|Disorders of gallbladder and biliary tract in diseases classified elsewhere
K87.1|Disorders of pancreas in diseases classified elsewhere
K90|Intestinal malabsorption
K90.0|Coeliac disease
K90.1|Tropical sprue
K90.2|Blind loop syndrome, not elsewhere classified
K90.3|Pancreatic steatorrhoea
K90.4|Malabsorption due to intolerance, not elsewhere classified
K90.8|Other intestinal malabsorption
K90.9|Intestinal malabsorption, unspecified
K91|Postprocedural disorders of digestive system, not elsewhere classified
K91.0|Vomiting following gastrointestinal surgery
K91.1|Postgastric surgery syndromes
K91.2|Postsurgical malabsorption, not elsewhere classified
K91.3|Postoperative intestinal obstruction
K91.4|Colostomy and enterostomy malfunction
K91.5|Postcholecystectomy syndrome
K91.8|Other postprocedural disorders of digestive system, not elsewhere classified
K91.9|Postprocedural disorder of digestive system, unspecified
K92|Other diseases of digestive system
K92.0|Haematemesis
K92.1|Melaena
K92.2|Gastrointestinal haemorrhage, unspecified
K92.8|Other specified diseases of digestive system
K92.9|Disease of digestive system, unspecified
K93|Disorders of other digestive organs in diseases classified elsewhere
K93.0|Tuberculous disorders of intestines, peritoneum and mesenteric glands
K93.1|Megacolon in chagas' disease
K93.8|Disord of oth spec digestive organs in dis class elsewhere
L00|Staphylococcal scalded skin syndrome
L01|Impetigo
L01.0|Impetigo [any organism] [any site]
L01.1|Impetiginization of other dermatoses
L02|Cutaneous abscess, furuncle and carbuncle
L02.0|Cutaneous abscess, furuncle and carbuncle of face
L02.1|Cutaneous abscess, furuncle and carbuncle of neck
L02.2|Cutaneous abscess, furuncle and carbuncle of trunk
L02.3|Cutaneous abscess, furuncle and carbuncle of buttock
L02.4|Cutaneous abscess, furuncle and carbuncle of limb
L02.8|Cutaneous abscess, furuncle and carbuncle of other sites
L02.9|Cutaneous abscess, furuncle and carbuncle, unspecified
L03|Cellulitis
L03.0|Cellulitis of finger and toe
L03.1|Cellulitis of other parts of limb
L03.2|Cellulitis of face
L03.3|Cellulitis of trunk
L03.8|Cellulitis of other sites
L03.9|Cellulitis, unspecified
L04|Acute lymphadenitis
L04.0|Acute lymphadenitis of face, head and neck
L04.1|Acute lymphadenitis of trunk
L04.2|Acute lymphadenitis of upper limb
L04.3|Acute lymphadenitis of lower limb
L04.8|Acute lymphadenitis of other sites
L04.9|Acute lymphadenitis, unspecified
L05|Pilonidal cyst
L05.0|Pilonidal cyst with abscess
L05.9|Pilonidal cyst without abscess
L08|Other local infections of skin and subcutaneous tissue
L08.0|Pyoderma
L08.1|Erythrasma
L08.8|Other specified local infections of skin and subcutaneous tissue
L08.9|Local infection of skin and subcutaneous tissue, unspecified
L10|Pemphigus
L10.0|Pemphigus vulgaris
L10.1|Pemphigus vegetans
L10.2|Pemphigus foliaceus
L10.3|Brazilian pemphigus [fogo selvagem]
L10.4|Pemphigus erythematosus
L10.5|Drug induced pemphigus
L10.8|Other pemphigus
L10.9|Pemphigus, unspecified
L11|Other acantholytic disorders
L11.0|Acquired keratosis follicularis
L11.1|Transient acantholytic dermatosis [grover]
L11.8|Other specified acantholytic disorders
L11.9|Acantholytic disorder, unspecified
L12|Pemphigoid
L12.0|Bullous pemphigoid
L12.1|Cicatricial pemphigoid
L12.2|Chronic bullous disease of childhood
L12.3|Acquired epidermolysis bullosa
L12.8|Other pemphigoid
L12.9|Pemphigoid, unspecified
L13|Other bullous disorders
L13.0|Dermatitis herpetiformis
L13.1|Subcorneal pustular dermatitis
L13.8|Other specified bullous disorders
L13.9|Bullous disorder, unspecified
L14|Bullous disorders in diseases classified elsewhere
L20|Atopic dermatitis
L20.0|Besnier's prurigo
L20.8|Other atopic dermatitis
L20.9|Atopic dermatitis, unspecified
L21|Seborrhoeic dermatitis
L21.0|Seborrhoea capitis
L21.1|Seborrhoeic infantile dermatitis
L21.8|Other seborrhoeic dermatitis
L21.9|Seborrhoeic dermatitis, unspecified
L22|Diaper [napkin] dermatitis
L23|Allergic contact dermatitis
L23.0|Allergic contact dermatitis due to metals
L23.1|Allergic contact dermatitis due to adhesives
L23.2|Allergic contact dermatitis due to cosmetics
L23.3|Allergic contact dermatitis due drugs in contact with skin
L23.4|Allergic contact dermatitis due to dyes
L23.5|Allergic contact dermatitis due to other chemical products
L23.6|Allergic contact dermatitis due to food in contact with skin
L23.7|Allergic contact dermatitis due to plants, except food
L23.8|Allergic contact dermatitis due to other agents
L23.9|Allergic contact dermatitis, unspecified cause
L24|Irritant contact dermatitis
L24.0|Irritant contact dermatitis due to detergents
L24.1|Irritant contact dermatitis due to oils and greases
L24.2|Irritant contact dermatitis due to solvents
L24.3|Irritant contact dermatitis due to cosmetics
L24.4|Irritant contact dermatitis due drugs in contact with skin
L24.5|Irritant contact dermatitis due to other chemical products
L24.6|Irritant contact dermatitis due to food in contact with skin
L24.7|Irritant contact dermatitis due to plants, except food
L24.8|Irritant contact dermatitis due to other agents
L24.9|Irritant contact dermatitis, unspecified cause
L25|Unspecified contact dermatitis
L25.0|Unspecified contact dermatitis due to cosmetics
L25.1|Unspecified contact dermatitis due to drugs in contact with skin
L25.2|Unspecified contact dermatitis due to dyes
L25.3|Unspecified contact dermatitis due to other chemical products
L25.4|Unspecified contact dermatitis due to food in contact with skin
L25.5|Unspecified contact dermatitis due to plants, except food
L25.8|Unspecified contact dermatitis due to other agents
L25.9|Unspecified contact dermatitis, unspecified cause
L26|Exfoliative dermatitis
L27|Dermatitis due to substances taken internally
L27.0|Generalized skin eruption due to drugs and medicaments
L27.1|Localized skin eruption due to drugs and medicaments
L27.2|Dermatitis due to ingested food
L27.8|Dermatitis due to other substances taken internally
L27.9|Dermatitis due to unspecified substance taken internally
L28|Lichen simplex chronicus and prurigo
L28.0|Lichen simplex chronicus
L28.1|Prurigo nodularis
L28.2|Other prurigo
L29|Pruritus
L29.0|Pruritus ani
L29.1|Pruritus scroti
L29.2|Pruritus vulvae
L29.3|Anogenital pruritus, unspecified
L29.8|Other pruritus
L29.9|Pruritus, unspecified
L30|Other dermatitis
L30.0|Nummular dermatitis
L30.1|Dyshidrosis [pompholyx]
L30.2|Cutaneous autosensitization
L30.3|Infective dermatitis
L30.4|Erythema intertrigo
L30.5|Pityriasis alba
L30.8|Other specified dermatitis
L30.9|Dermatitis, unspecified
L40|Psoriasis
L40.0|Psoriasis vulgaris
L40.1|Generalized pustular psoriasis
L40.2|Acrodermatitis continua
L40.3|Pustulosis palmaris et plantaris
L40.4|Guttate psoriasis
L40.5|Arthropathic psoriasis
L40.8|Other psoriasis
L40.9|Psoriasis, unspecified
L41|Parapsoriasis
L41.0|Pityriasis lichenoides et varioliformis acuta
L41.1|Pityriasis lichenoides chronica
L41.2|Lymphomatoid papulosis
L41.3|Small plaque parapsoriasis
L41.4|Large plaque parapsoriasis
L41.5|Retiform parapsoriasis
L41.8|Other parapsoriasis
L41.9|Parapsoriasis, unspecified
L42|Pityriasis rosea
L43|Lichen planus
L43.0|Hypertrophic lichen planus
L43.1|Bullous lichen planus
L43.2|Lichenoid drug reaction
L43.3|Subacute (active) lichen planus
L43.8|Other lichen planus
L43.9|Lichen planus, unspecified
L44|Other papulosquamous disorders
L44.0|Pityriasis rubra pilaris
L44.1|Lichen nitidus
L44.2|Lichen striatus
L44.3|Lichen ruber moniliformis
L44.4|Infantile papular acrodermatitis [giannotti-crosti]
L44.8|Other specified papulosquamous disorders
L44.9|Papulosquamous disorder, unspecified
L45|Papulosquamous disorders in diseases classif elsewhere
L50|Urticaria
L50.0|Allergic urticaria
L50.1|Idiopathic urticaria
L50.2|Urticaria due to cold and heat
L50.3|Dermatographic urticaria
L50.4|Vibratory urticaria
L50.5|Cholinergic urticaria
L50.6|Contact urticaria
L50.8|Other urticaria
L50.9|Urticaria, unspecified
L51|Erythema multiforme
L51.0|Nonbullous erythema multiforme
L51.1|Bullous erythema multiforme
L51.2|Toxic epidermal necrolysis [lyell]
L51.8|Other erythema multiforme
L51.9|Erythema multiforme, unspecified
L52|Erythema nodosum
L53|Other erythematous conditions
L53.0|Toxic erythema
L53.1|Erythema annulare centrifugum
L53.2|Erythema marginatum
L53.3|Other chronic figurate erythema
L53.8|Other specified erythematous conditions
L53.9|Erythematous condition, unspecified
L54|Erythema in diseases classified elsewhere
L54.0|Erythema marginatum in acute rheumatic fever
L54.8|Erythema in other diseases classified elsewhere
L55|Sunburn
L55.0|Sunburn of first degree
L55.1|Sunburn of second degree
L55.2|Sunburn of third degree
L55.8|Other sunburn
L55.9|Sunburn, unspecified
L56|Other acute skin changes due to ultraviolet radiation
L56.0|Drug phototoxic response
L56.1|Drug photoallergic response
L56.2|Photocontact dermatitis [berloque dermatitis]
L56.3|Solar urticaria
L56.4|Polymorphous light eruption
L56.8|Other specified acute skin changes due to ultraviolet radiation
L56.9|Acute skin change due to ultraviolet radiation, unspecified
L57|Skin changes due to chronic exposure to nonionizing radiation
L57.0|Actinic keratosis
L57.1|Actinic reticuloid
L57.2|Cutis rhomboidalis nuchae
L57.3|Poikiloderma of civatte
L57.4|Cutis laxa senilis
L57.5|Actinic granuloma
L57.8|Other skin change due chronic exposure to nonionizing radiation
L57.9|Skin change due chronic exposure to nonionizing radiation, unspecified
L58|Radiodermatitis
L58.0|Acute radiodermatitis
L58.1|Chronic radiodermatitis
L58.9|Radiodermatitis, unspecified
L59|Other disorders of skin and subcutaneous tissue related to radiation
L59.0|Erythema ab igne [dermatitis ab igne]
L59.8|Other specified disorders of skin and subcutaneous tissue related to radiation
L59.9|Disorder of skin and subcutaneous tissue related to radiation unspecified
L60|Nail disorders
L60.0|Ingrowing nail
L60.1|Onycholysis
L60.2|Onychogryphosis
L60.3|Nail dystrophy
L60.4|Beau's lines
L60.5|Yellow nail syndrome
L60.8|Other nail disorders
L60.9|Nail disorder, unspecified
L62|Nail disorders in diseases classified elsewhere
L62.0|Clubbed nail pachydermoperiostosis
L62.8|Nail disorders in other diseases classified elsewhere
L63|Alopecia areata
L63.0|Alopecia (capitis) totalis
L63.1|Alopecia universalis
L63.2|Ophiasis
L63.8|Other alopecia areata
L63.9|Alopecia areata, unspecified
L64|Androgenic alopecia
L64.0|Drug-induced androgenic alopecia
L64.8|Other androgenic alopecia
L64.9|Androgenic alopecia, unspecified
L65|Other nonscarring hair loss
L65.0|Telogen effluvium
L65.1|Anagen effluvium
L65.2|Alopecia mucinosa
L65.8|Other specified nonscarring hair loss
L65.9|Nonscarring hair loss, unspecified
L66|Cicatricial alopecia [scarring hair loss]
L66.0|Pseudopelade
L66.1|Lichen planopilaris
L66.2|Folliculitis decalvans
L66.3|Perifolliculitis capitis abscedens
L66.4|Folliculitis ulerythematosa reticulata
L66.8|Other cicatricial alopecia
L66.9|Cicatricial alopecia, unspecified
L67|Hair colour and hair shaft abnormalities
L67.0|Trichorrhexis nodosa
L67.1|Variations in hair colour
L67.8|Other hair colour and hair shaft abnormalities
L67.9|Hair colour and hair shaft abnormality, unspecified
L68|Hypertrichosis
L68.0|Hirsutism
L68.1|Acquired hypertrichosis lanuginosa
L68.2|Localized hypertrichosis
L68.3|Polytrichia
L68.8|Other hypertrichosis
L68.9|Hypertrichosis, unspecified
L70|Acne
L70.0|Acne vulgaris
L70.1|Acne conglobata
L70.2|Acne varioliformis
L70.3|Acne tropica
L70.4|Infantile acne
L70.5|Acn
L70.8|Other acne
L70.9|Acne, unspecified
L71|Rosacea
L71.0|Perioral dermatitis
L71.1|Rhinophyma
L71.8|Other rosacea
L71.9|Rosacea, unspecified
L72|Follicular cysts of skin and subcutaneous tissue
L72.0|Epidermal cyst
L72.1|Trichilemmal cyst
L72.2|Steatocystoma multiplex
L72.8|Other follicular cysts of skin and subcutaneous tissue
L72.9|Follicular cyst of skin and subcutaneous tissue, unspecified
L73|Other follicular disorders
L73.0|Acne keloid
L73.1|Pseudofolliculitis barbae
L73.2|Hidradenitis suppurativa
L73.8|Other specified follicular disorders
L73.9|Follicular disorder, unspecified
L74|Eccrine sweat disorders
L74.0|Miliaria rubra
L74.1|Miliaria crystallina
L74.2|Miliaria profunda
L74.3|Miliaria, unspecified
L74.4|Anhidrosis
L74.8|Other eccrine sweat disorders
L74.9|Eccrine sweat disorder, unspecified
L75|Apocrine sweat disorders
L75.0|Bromhidrosis
L75.1|Chromhidrosis
L75.2|Apocrine miliaria
L75.8|Other apocrine sweat disorders
L75.9|Apocrine sweat disorder, unspecified
L80|Vitiligo
L81|Other disorders of pigmentation
L81.0|Postinflammatory hyperpigmentation
L81.1|Chloasma
L81.2|Freckles
L81.3|Cafe au Lait Spots
L81.4|Other melanin hyperpigmentation
L81.5|Leukoderma, not elsewhere classified
L81.6|Other disorders of diminished melanin formation
L81.7|Pigmented purpuric dermatosis
L81.8|Other specified disorders of pigmentation
L81.9|Disorder of pigmentation, unspecified
L82|Seborrhoeic keratosis
L83|Acanthosis nigricans
L84|Corns and callosities
L85|Other epidermal thickening
L85.0|Acquired ichthyosis
L85.1|Acquired keratosis [keratoderma] palmaris et plantaris
L85.2|Keratosis punctata (palmaris et plantaris)
L85.3|Xerosis cutis
L85.8|Other specified epidermal thickening
L85.9|Epidermal thickening, unspecified
L86|Keratoderma in diseases classified elsewhere
L87|Transepidermal elimination disorders
L87.0|Keratosis foll et parafoicularis cutem penetrans [kyrle]
L87.1|Reactive perforating collagenosis
L87.2|Elastosis perforans serpiginosa
L87.8|Other transepidermal elimination disorders
L87.9|Transepidermal elimination disorder, unspecified
L88|Pyoderma gangrenosum
L89|Decubitus ulcer
L89.0|Stage I decubitus ulcer and pressure area
L89.1|Stage II decubitus ulcer
L89.2|Stage III decubitus ulcer
L89.3|Stage IV decubitus ulcer
L89.9|Decubitus ulcer and pressure area, unspecified
L90|Atrophic disorders of skin
L90.0|Lichen sclerosus et atrophicus
L90.1|Anetoderma of Schweninger-Buzzi
L90.2|Anetoderma of Jadassohn-Pellizzari
L90.3|Atrophoderma of Pasini and Pierini
L90.4|Acrodermatitis chronica atrophicans
L90.5|Scar conditions and fibrosis of skin
L90.6|Striae atrophicae
L90.8|Other atrophic disorders of skin
L90.9|Atrophic disorder of skin, unspecified
L91|Hypertrophic disorders of skin
L91.0|Keloid scar
L91.8|Other hypertrophic disorders of skin
L91.9|Hypertrophic disorder of skin, unspecified
L92|Granulomatous disorders of skin and subcutaneous tissue
L92.0|Granuloma annulare
L92.1|Necrobiosis lipoidica, not elsewhere classified
L92.2|Granuloma faciale [eosinophilic granuloma of skin]
L92.3|Foreign body granuloma of skin and subcutaneous tissue
L92.8|Other granulomatous disorders of skin and subcutaneous tissue
L92.9|Granulomatous disorder of skin and subcutaneous tissue, unspecified
L93|Lupus erythematosus
L93.0|Discoid lupus erythematosus
L93.1|Subacute cutaneous lupus erythematosus
L93.2|Other local lupus erythematosus
L94|Other localized connective tissue disorders
L94.0|Localized scleroderma [morphea]
L94.1|Linear scleroderma
L94.2|Calcinosis cutis
L94.3|Sclerodactyly
L94.4|Gottron's papules
L94.5|Poikiloderma vasculare atrophicans
L94.6|Ainhum
L94.8|Other specified localized connective tissue disorders
L94.9|Localized connective tissue disorder, unspecified
L95|Vasculitis limited to skin, not elsewhere classified
L95.0|Livedoid vasculitis
L95.1|Erythema elevatum diutinum
L95.8|Other vasculitis limited to skin
L95.9|Vasculitis limited to skin, unspecified
L97|Ulcer of lower limb, not elsewhere classified
L98|Other disorders of skin and subcutaneous tissue, not elsewhere classified
L98.0|Pyogenic granuloma
L98.1|Factitial dermatitis
L98.2|Febrile neutrophilic dermatosis [Sweet]
L98.3|Eosinophilic cellulitis [Wells]
L98.4|Chronic ulcer of skin, not elsewhere classified
L98.5|Mucinosis of skin
L98.6|Other infiltrative disorders of skin and subcutaneous tissue
L98.8|Other specified disorders of skin and subcutaneous tissue
L98.9|Disorder of skin and subcutaneous tissue, unspecified
L99|Other disorders of skin and subcutaneous tissue in diseases classified elsewhere
L99.0|Amyloidosis of skin
L99.8|Other specified disorders of skin and subcutaneous tissue in disease classified elsewhere
M00|Pyogenic arthritis
M00.0|Staphylococcal arthritis and polyarthritis
M00.00|Staphylococcal arthritis and polyarthritis, multiple sites
M00.01|Staphylococcal arthritis and polyarthritis, shoulder region
M00.02|Staphylococcal arthritis and polyarthritis, upper arm
M00.03|Staphylococcal arthritis and polyarthritis, forearm
M00.04|Staphylococcal arthritis and polyarthritis, hand
M00.05|Staphylococcal arthritis and polyarthritis, pelvic and thigh
M00.06|Staphylococcal arthritis and polyarthritis, lower leg
M00.07|Staphylococcal arthritis and polyarthritis, ankle and foot
M00.08|Staphylococcal arthritis and polyarthritis, other site
M00.09|Staphylococcal arthritis and polyarthritis, unspecified site
M00.1|Pneumococcal arthritis and polyarthritis
M00.10|Pneumococcal arthritis and polyarthritis, multiple sites
M00.11|Pneumococcal arthritis and polyarthritis, shoulder region
M00.12|Pneumococcal arthritis and polyarthritis, upper arm
M00.13|Pneumococcal arthritis and polyarthritis, forearm
M00.14|Pneumococcal arthritis and polyarthritis, hand
M00.15|Pneumococcal arthritis and polyarthritis, pelvic and thigh
M00.16|Pneumococcal arthritis and polyarthritis, lower leg
M00.17|Pneumococcal arthritis and polyarthritis, ankle and foot
M00.18|Pneumococcal arthritis and polyarthritis, other sites
M00.19|Pneumococcal arthritis and polyarthritis, unspecified site
M00.2|Other streptococcal arthritis and polyarthritis
M00.20|Other streptococcal arthritis and polyarthritis, multiple sites
M00.21|Other streptococcal arthritis and polyarthritis, shoulder region
M00.22|Other streptococcal arthritis and polyarthritis, upper arm
M00.23|Other streptococcal arthritis and polyarthritis, forearm
M00.24|Other streptococcal arthritis and polyarthritis, hand
M00.25|Other streptococcal arthritis and polyarthritis, pelvic and thigh
M00.26|Other streptococcal arthritis and polyarthritis, lower leg
M00.27|Other streptococcal arthritis and polyarthritis, ankle and foot
M00.28|Other streptococcal arthritis and polyarthritis, other sites
M00.29|Other streptococcal arthritis and polyarthritis, unspecified site
M00.8|Arthritis and polyarthritis due other specified bacterial agents
M00.80|Arthritis and polyarthritis due other specified  bacterial agents, multiple sites
M00.81|Arthritis and polyarthritis due other specified  bacterial agents, shouder region
M00.82|Arthritis and polyarthritis due other specified  bacterial agents, upper arm
M00.83|Arthritis and polyarthritis due other specified  bacterial agents, forearm
M00.84|Arthritis and polyarthritis due other specified  bacterial agents, hand
M00.85|Arthritis and polyarthritis due other specified  bacterial agents, pelvic and thigh
M00.86|Arthritis and polyarthritis due other specified  bacterial agents, lower leg
M00.87|Arthritis and polyarthritis due other specified  bacterial agents, ankle and foot
M00.88|Arthritis and polyarthritis due other specified  bacterial agents, other sites
M00.89|Arthritis and polyarthritis due other specified  bacterial agents, unspecified site
M00.9|Pyogenic arthritis, unspecified
M00.90|Pyogenic arthritis, unspecified, multiple sites
M00.91|Pyogenic arthritis, unspecified, shoulder region
M00.92|Pyogenic arthritis, unspecified, upper arm
M00.93|Pyogenic arthritis, unspecified, forearm
M00.94|Pyogenic arthritis, unspecified, hand
M00.95|Pyogenic arthritis, unspecified, pelvic and thigh
M00.96|Pyogenic arthritis, unspecified, lower leg
M00.97|Pyogenic arthritis, unspecified, ankle and foot
M00.98|Pyogenic arthritis, unspecified, other sites
M00.99|Pyogenic arthritis, unspecified, unspecified site
M01|Direct infections of joint in infectious and parasitic diseases classified elsewhere
M01.0|Meningococcal arthritis
M01.00|Meningococcal arthritis, multiple sites
M01.01|Meningococcal arthritis, shoulder region
M01.02|Meningococcal arthritis, upper arm
M01.03|Meningococcal arthritis, forearm
M01.04|Meningococcal arthritis, hand
M01.05|Meningococcal arthritis, pelvic and thigh
M01.06|Meningococcal arthritis, lower leg
M01.07|Meningococcal arthritis, ankle and foot
M01.08|Meningococcal arthritis, other sites
M01.09|Meningococcal arthritis, unspecified site
M01.1|Tuberculous arthritis
M01.10|Tuberculous arthritis, multiple sites
M01.11|Tuberculous arthritis, shoulder region
M01.12|Tuberculous arthritis, upper arm
M01.13|Tuberculous arthritis, forearm
M01.14|Tuberculous arthritis, hand
M01.15|Tuberculous arthritis, pelvic and thigh
M01.16|Tuberculous arthritis, lower leg
M01.17|Tuberculous arthritis, ankle and foot
M01.18|Tuberculous arthritis, other sites
M01.19|Tuberculous arthritis, unspecified site
M01.2|Arthritis in lyme disease
M01.20|Arthritis in lyme disease, multiple sites
M01.21|Arthritis in lyme disease, shoulder region
M01.22|Arthritis in lyme disease, upper arm
M01.23|Arthritis in lyme disease, forearm
M01.24|Arthritis in lyme disease, hand
M01.25|Arthritis in lyme disease, pelvic and thigh
M01.26|Arthritis in lyme disease, lower leg
M01.27|Arthritis in lyme disease, ankle and foot
M01.28|Arthritis in lyme disease, other sites
M01.29|Arthritis in lyme disease, unspecified site
M01.3|Arthritis in other bacterial diseases classified elsewhere
M01.30|Arthritis in other bacterial diseases classified elsewhere, multiple sites
M01.31|Arthritis in other bacterial diseases classified elsewhere, shouder region
M01.32|Arthritis in other bacterial diseases classified elsewhere, upper arm
M01.33|Arthritis in other bacterial diseases classified elsewhere, forearm
M01.34|Arthritis in other bacterial diseases classified elsewhere, hand
M01.35|Arthritis in other bacterial diseases classified elsewhere, pelvic and thigh
M01.36|Arthritis in other bacterial diseases classified elsewhere, lower leg
M01.37|Arthritis in other bacterial diseases classified elsewhere, ankle and foot
M01.38|Arthritis in other bacterial diseases classified elsewhere, other sites
M01.39|Arthritis in other bacterial diseases classified elsewhere, unspecified site
M01.4|Rubella arthritis
M01.40|Rubella arthritis, multiple sites
M01.41|Rubella arthritis, shoulder region
M01.42|Rubella arthritis, upper arm
M01.43|Rubella arthritis, forearm
M01.44|Rubella arthritis, hand
M01.45|Rubella arthritis, pelvic and thigh
M01.46|Rubella arthritis, lower leg
M01.47|Rubella arthritis, ankle and foot
M01.48|Rubella arthritis, other sites
M01.49|Rubella arthritis, unspecified site
M01.5|Arthritis in other viral diseases classified elsewhere
M01.50|Arthritis in other viral diseases classified elsewhere, multiple sites
M01.51|Arthritis in other viral diseases classified elsewhere, shoulder region
M01.52|Arthritis in other viral diseases classified elsewhere, upper arm
M01.53|Arthritis in other viral diseases classified elsewhere, forearm
M01.54|Arthritis in other viral diseases classified elsewhere, hand
M01.55|Arthritis in other viral diseases classified elsewhere, pelvic and thigh
M01.56|Arthritis in other viral diseases classified elsewhere, lower leg
M01.57|Arthritis in other viral diseases classified elsewhere, ankle and foot
M01.58|Arthritis in other viral diseases classified elsewhere, other sites
M01.59|Arthritis in other viral diseases classified elsewhere, unspecified site
M01.6|Arhritis in mycoses
M01.60|Arhritis in mycoses, multiple sites
M01.61|Arhritis in mycoses, shoulder region
M01.62|Arhritis in mycoses, upper arm
M01.63|Arhritis in mycoses, forearm
M01.64|Arhritis in mycoses, hand
M01.65|Arhritis in mycoses, pelvic and thigh
M01.66|Arhritis in mycoses, lower leg
M01.67|Arhritis in mycoses, ankle and foot
M01.68|Arhritis in mycoses, other sites
M01.69|Arhritis in mycoses, unspecified site
M01.8|Arthritis in other infectious and parasitic diseases classified elsewhere
M01.80|Arthritis in other infectious and parasitic diseases classified elsewhere, multiple sites
M01.81|Arthritis in other infectious and parasitic diseases classified elsewhere, shoulder region
M01.82|Arthritis in other infectious and parasitic diseases classified elsewhere, upper arm
M01.83|Arthritis in other infectious and parasitic diseases classified elsewhere, forearm
M01.84|Arthritis in other infectious and parasitic diseases classified elsewhere, hand
M01.85|Arthritis in other infectious and parasitic diseases classified elsewhere, pelvic and thigh
M01.86|Arthritis in other infectious and parasitic diseases classified elsewhere, lower leg
M01.87|Arthritis in other infectious and parasitic diseases classified elsewhere, ankle and foot
M01.88|Arthritis in other infectious and parasitic diseases classified elsewhere, other sites
M01.89|Arthritis in other infectious and parasitic diseases classified elsewhere, unspecified site
M02|Reactive arthropathies
M02.0|Arthropathy following intestinal bypass
M02.00|Arthropathy following intestinal bypass, multiple sites
M02.01|Arthropathy following intestinal bypass, shoulder region
M02.02|Arthropathy following intestinal bypass, upper arm
M02.03|Arthropathy following intestinal bypass, forearm
M02.04|Arthropathy following intestinal bypass, hand
M02.05|Arthropathy following intestinal bypass, pelvic and thigh
M02.06|Arthropathy following intestinal bypass, lower leg
M02.07|Arthropathy following intestinal bypass, ankle and foot
M02.08|Arthropathy following intestinal bypass, other sites
M02.09|Arthropathy following intestinal bypass, unspecified site
M02.1|Postdysenteric arthropathy
M02.10|Postdysenteric arthropathy, multiple sites
M02.11|Postdysenteric arthropathy, shoulder region
M02.12|Postdysenteric arthropathy, upper arm
M02.13|Postdysenteric arthropathy, forearm
M02.14|Postdysenteric arthropathy, hand
M02.15|Postdysenteric arthropathy, pelvic and thigh
M02.16|Postdysenteric arthropathy, lower leg
M02.17|Postdysenteric arthropathy, ankle and foot
M02.18|Postdysenteric arthropathy, other sites
M02.19|Postdysenteric arthropathy, unspecified site
M02.2|Postimmunization arthropathy
M02.20|Postimmunization arthropathy, multiple sites
M02.21|Postimmunization arthropathy, shoulder region
M02.22|Postimmunization arthropathy, upper arm
M02.23|Postimmunization arthropathy, forearm
M02.24|Postimmunization arthropathy, hand
M02.25|Postimmunization arthropathy, pelvic and thigh
M02.26|Postimmunization arthropathy, lower leg
M02.27|Postimmunization arthropathy, ankle and foot
M02.28|Postimmunization arthropathy, other sites
M02.29|Postimmunization arthropathy, unspecified site
M02.3|Reiter's disease
M02.30|Reiter's disease, multiple sites
M02.31|Reiter's disease, shoulder region
M02.32|Reiter's disease, upper arm
M02.33|Reiter's disease, forearm
M02.34|Reiter's disease, hand
M02.35|Reiter's disease, pelvic and thigh
M02.36|Reiter's disease, lower leg
M02.37|Reiter's disease, ankle and foot
M02.38|Reiter's disease, other sites
M02.39|Reiter's disease, unspecified site
M02.8|Other reactive arthropathies
M02.80|Other reactive arthropathies, multiple sites
M02.81|Other reactive arthropathies, shouder region
M02.82|Other reactive arthropathies, upper arm
M02.83|Other reactive arthropathies, forearm
M02.84|Other reactive arthropathies, hand
M02.85|Other reactive arthropathies, pelvic and thigh
M02.86|Other reactive arthropathies, lower leg
M02.87|Other reactive arthropathies, ankle and foot
M02.88|Other reactive arthropathies, other sites
M02.89|Other reactive arthropathies, unspecified site
M02.9|Reactive arthropathy, unspecified
M02.90|Reactive arthropathy, unspecified, multiple sites
M02.91|Reactive arthropathy, unspecified, shoulder region
M02.92|Reactive arthropathy, unspecified, upper arm
M02.93|Reactive arthropathy, unspecified, forearm
M02.94|Reactive arthropathy, unspecified, hand
M02.95|Reactive arthropathy, unspecified, pelvic and thigh
M02.96|Reactive arthropathy, unspecified, lower leg
M02.97|Reactive arthropathy, unspecified, ankle and foot
M02.98|Reactive arthropathy, unspecified, other sites
M02.99|Reactive arthropathy, unspecified, unspecified site
M03|Postinfective and reactive arthropathies in diseases classified elsewhere
M03.0|Postmeningococcal arthritis
M03.00|Postmeningococcal arthritis, multiple sites
M03.01|Postmeningococcal arthritis, shoulder region
M03.02|Postmeningococcal arthritis, upper arm
M03.03|Postmeningococcal arthritis, forearm
M03.04|Postmeningococcal arthritis, hand
M03.05|Postmeningococcal arthritis, pelvic and thigh
M03.06|Postmeningococcal arthritis, lower leg
M03.07|Postmeningococcal arthritis, ankle and foot
M03.08|Postmeningococcal arthritis, other sites
M03.09|Postmeningococcal arthritis, unspecified site
M03.1|Postinfective arthropathy in syphilis
M03.10|Postinfective arthropathy in syphilis, multiple sites
M03.11|Postinfective arthropathy in syphilis, shoulder region
M03.12|Postinfective arthropathy in syphilis, upper arm
M03.13|Postinfective arthropathy in syphilis, forearm
M03.14|Postinfective arthropathy in syphilis, hand
M03.15|Postinfective arthropathy in syphilis, pelvic and thigh
M03.16|Postinfective arthropathy in syphilis, lower leg
M03.17|Postinfective arthropathy in syphilis, ankle and foot
M03.18|Postinfective arthropathy in syphilis, other sites
M03.19|Postinfective arthropathy in syphilis, unspecified site
M03.2|Other postinfectious arthropathies in diseases classified elsewhere
M03.20|Other postinfectious arthropathies in diseases classified elsewhere, multiple sites
M03.21|Other postinfectious arthropathies in diseases classified elsewhere, shoulder region
M03.22|Other postinfectious arthropathies in diseases classified elsewhere, upper arm
M03.23|Other postinfectious arthropathies in diseases classified elsewhere, forearm
M03.24|Other postinfectious arthropathies in diseases classified elsewhere, hand
M03.25|Other postinfectious arthropathies in diseases classified elsewhere, pelvic and thigh
M03.26|Other postinfectious arthropathies in diseases classified elsewhere, lower leg
M03.27|Other postinfectious arthropathies in diseases classified elsewhere, ankle and foot
M03.28|Other postinfectious arthropathies in diseases classified elsewhere, other sites
M03.29|Other postinfectious arthropathies in diseases classified elsewhere, unspecified site
M03.6|Reactive arthropathy in other diseases classified elsewhere
M03.60|Reactive arthropathy in other diseases classified elsewhere, multiple sites
M03.61|Reactive arthropathy in other diseases classified elsewhere, shoulder region
M03.62|Reactive arthropathy in other diseases classified elsewhere, upper arm
M03.63|Reactive arthropathy in other diseases classified elsewhere, forearm
M03.64|Reactive arthropathy in other diseases classified elsewhere, hand
M03.65|Reactive arthropathy in other diseases classified elsewhere, pelvic and thigh
M03.66|Reactive arthropathy in other diseases classified elsewhere, lower leg
M03.67|Reactive arthropathy in other diseases classified elsewhere, ankle and foot
M03.68|Reactive arthropathy in other diseases classified elsewhere, other sites
M03.69|Reactive arthropathy in other diseases classified elsewhere, unspecified site
M05|Seropositive rheumatoid arthritis
M05.0|Seropositive Felty's syndrome
M05.00|Seropositive Felty's syndrome, multiple sites
M05.01|Seropositive Felty's syndrome, shoulder region
M05.02|Seropositive Felty's syndrome, upper arm
M05.03|Seropositive Felty's syndrome, forearm
M05.04|Seropositive Felty's syndrome, hand
M05.05|Seropositive Felty's syndrome, pelvic and thigh
M05.06|Seropositive Felty's syndrome, lower leg
M05.07|Seropositive Felty's syndrome, ankle and foot
M05.08|Seropositive Felty's syndrome, other sites
M05.09|Seropositive Felty's syndrome, unspecified site
M05.1|Seropositive rheumatoid lung disease
M05.10|Seropositive rheumatoid lung disease, multiple sites
M05.11|Seropositive rheumatoid lung disease, shoulder region
M05.12|Seropositive rheumatoid lung disease, upper arm
M05.13|Seropositive rheumatoid lung disease, forearm
M05.14|Seropositive rheumatoid lung disease, hand
M05.15|Seropositive rheumatoid lung disease, pelvic and thigh
M05.16|Seropositive rheumatoid lung disease, lower leg
M05.17|Seropositive rheumatoid lung disease, ankle and foot
M05.18|Seropositive rheumatoid lung disease, other sites
M05.19|Seropositive rheumatoid lung disease, unspecified site
M05.2|Seropositive rheumatoid vasculitis
M05.20|Seropositive rheumatoid vasculitis, multiple sites
M05.21|Seropositive rheumatoid vasculitis, shoulder region
M05.22|Seropositive rheumatoid vasculitis, upper arm
M05.23|Seropositive rheumatoid vasculitis, forearm
M05.24|Seropositive rheumatoid vasculitis, hand
M05.25|Seropositive rheumatoid vasculitis, pelvic and thigh
M05.26|Seropositive rheumatoid vasculitis, lower leg
M05.27|Seropositive rheumatoid vasculitis, ankle and foot
M05.28|Seropositive rheumatoid vasculitis, other sites
M05.29|Seropositive rheumatoid vasculitis, unspecified site
M05.3|Seropositive rheumatoid arthritis with involvement of oth organs and sys
M05.30|Seropositive rheumatoid arthritis with involvement of other organs and system, multiple site
M05.31|Seropositive rheumatoid arthritis with involvement of other organs and system, shoulder region
M05.32|Seropositive rheumatoid arthritis with involvement of other organs and system, upper arm
M05.33|Seropositive rheumatoid arthritis with involvement of other organs and system, forearm
M05.34|Seropositive rheumatoid arthritis with involvement of other organs and system, hand
M05.35|Seropositive rheumatoid arthritis with involvement of other organs and system, pelvic and thigh
M05.36|Seropositive rheumatoid arthritis with involvement of other organs and system, lower leg
M05.37|Seropositive rheumatoid arthritis with involvement of other organs and system, ankle and foot
M05.38|Seropositive rheumatoid arthritis with involvement of other organs and system, other sites
M05.39|Seropositive rheumatoid arthritis with involvement of other organs and system, unspecified site
M05.8|Other seropositive rheumatoid arthritis
M05.80|Other seropositive rheumatoid arthritis, multiple sites
M05.81|Other seropositive rheumatoid arthritis, shoulder region
M05.82|Other seropositive rheumatoid arthritis, upper arm
M05.83|Other seropositive rheumatoid arthritis, forearm
M05.84|Other seropositive rheumatoid arthritis, hand
M05.85|Other seropositive rheumatoid arthritis, pelvic and thigh
M05.86|Other seropositive rheumatoid arthritis, lower leg
M05.87|Other seropositive rheumatoid arthritis, ankle and foot
M05.88|Other seropositive rheumatoid arthritis, other sites
M05.89|Other seropositive rheumatoid arthritis, unspecified site
M05.9|Seropositive rheumatoid arthritis, unspecified
M05.90|Seropositive rheumatoid arthritis, unspecified, multiple sites
M05.91|Seropositive rheumatoid arthritis, unspecified, shoulder region
M05.92|Seropositive rheumatoid arthritis, unspecified, upper arm
M05.93|Seropositive rheumatoid arthritis, unspecified, forearm
M05.94|Seropositive rheumatoid arthritis, unspecified, hand
M05.95|Seropositive rheumatoid arthritis, unspecified, pelvic and thigh
M05.96|Seropositive rheumatoid arthritis, unspecified, lower leg
M05.97|Seropositive rheumatoid arthritis, unspecified, ankle and foot
M05.98|Seropositive rheumatoid arthritis, unspecified, other sites
M05.99|Seropositive rheumatoid arthritis, unspecified, unspecified site
M06|Other rheumatoid arthritis
M06.0|Seronegative rheumatoid arthritis
M06.00|Seronegative rheumatoid arthritis, multiple sites
M06.01|Seronegative rheumatoid arthritis, shoulder region
M06.02|Seronegative rheumatoid arthritis, upper arm
M06.03|Seronegative rheumatoid arthritis, forearm
M06.04|Seronegative rheumatoid arthritis, hand
M06.05|Seronegative rheumatoid arthritis, pelvic and thigh
M06.06|Seronegative rheumatoid arthritis, lower leg
M06.07|Seronegative rheumatoid arthritis, ankle and foot
M06.08|Seronegative rheumatoid arthritis, other sites
M06.09|Seronegative rheumatoid arthritis, unspecified site
M06.1|Adult-onset still's disease
M06.10|Adult-onset still's disease, multiple sites
M06.11|Adult-onset still's disease, shoulder region
M06.12|Adult-onset still's disease, upper arm
M06.13|Adult-onset still's disease, forearm
M06.14|Adult-onset still's disease, hand
M06.15|Adult-onset still's disease, pelvic and thigh
M06.16|Adult-onset still's disease, lower leg
M06.17|Adult-onset still's disease, ankle and foot
M06.18|Adult-onset still's disease, other sites
M06.19|Adult-onset still's disease, unspecified site
M06.2|Rheumatoid bursitis
M06.20|Rheumatoid bursitis, multiple sites
M06.21|Rheumatoid bursitis, shoulder region
M06.22|Rheumatoid bursitis, upper arm
M06.23|Rheumatoid bursitis, forearm
M06.24|Rheumatoid bursitis, hand
M06.25|Rheumatoid bursitis, pelvic and thigh
M06.26|Rheumatoid bursitis, lower leg
M06.27|Rheumatoid bursitis, ankle and foot
M06.28|Rheumatoid bursitis, other sites
M06.29|Rheumatoid bursitis, unspecified site
M06.3|Rheumatoid nodule
M06.30|Rheumatoid nodule, multiple sites
M06.31|Rheumatoid nodule, shoulder region
M06.32|Rheumatoid nodule, upper arm
M06.33|Rheumatoid nodule, forearm
M06.34|Rheumatoid nodule, hand
M06.35|Rheumatoid nodule, pelvic and thigh
M06.36|Rheumatoid nodule, lower leg
M06.37|Rheumatoid nodule, ankle and foot
M06.38|Rheumatoid nodule, other sites
M06.39|Rheumatoid nodule, unspecified site
M06.4|Inflammatory polyarthropathy
M06.40|Inflammatory polyarthropathy, multiple sites
M06.41|Inflammatory polyarthropathy, shoulder region
M06.42|Inflammatory polyarthropathy, upper arm
M06.43|Inflammatory polyarthropathy, forearm
M06.44|Inflammatory polyarthropathy, hand
M06.45|Inflammatory polyarthropathy, pelvic and thigh
M06.46|Inflammatory polyarthropathy, lower leg
M06.47|Inflammatory polyarthropathy, ankle and foot
M06.48|Inflammatory polyarthropathy, other sites
M06.49|Inflammatory polyarthropathy, unspecified site
M06.8|Other specified rheumatoid arthritis
M06.80|Other specified rheumatoid arthritis, multiple sites
M06.81|Other specified rheumatoid arthritis, shoulder region
M06.82|Other specified rheumatoid arthritis, upper arm
M06.83|Other specified rheumatoid arthritis, forearm
M06.84|Other specified rheumatoid arthritis, hand
M06.85|Other specified rheumatoid arthritis, pelvic and thigh
M06.86|Other specified rheumatoid arthritis, lower leg
M06.87|Other specified rheumatoid arthritis, ankle and foot
M06.88|Other specified rheumatoid arthritis, other sites
M06.89|Other specified rheumatoid arthritis, unspecified site
M06.9|Rheumatoid arthritis, unspecified
M06.90|Rheumatoid arthritis, unspecified, multiple sites
M06.91|Rheumatoid arthritis, unspecified, shoulder region
M06.92|Rheumatoid arthritis, unspecified, upper arm
M06.93|Rheumatoid arthritis, unspecified, forearm
M06.94|Rheumatoid arthritis, unspecified, hand
M06.95|Rheumatoid arthritis, unspecified, pelvic and thigh
M06.96|Rheumatoid arthritis, unspecified, lower leg
M06.97|Rheumatoid arthritis, unspecified, ankle and foot
M06.98|Rheumatoid arthritis, unspecified, other sites
M06.99|Rheumatoid arthritis, unspecified, unspecified site
M07|Psoriatic and enteropathic arthropathies
M07.0|Distal interphalangeal proriatic arthropathy
M07.00|Distal interphalangeal psoriatic arthropathy, multiple sites
M07.04|Distal interphalangeal psoriatic arthropathy, hand
M07.07|Distal interphalangeal psoriatic arthropathy, ankle and foot
M07.09|Distal interphalangeal psoriatic arthropathy, site unspecified
M07.1|Arthritis mutilans
M07.10|Arthritis mutilans, multiple sites
M07.11|Arthritis mutilans, shoulder region
M07.12|Arthritis mutilans, upper arm
M07.13|Arthritis mutilans, forearm
M07.14|Arthritis mutilans, hand
M07.15|Arthritis mutilans, pelvic and thigh
M07.16|Arthritis mutilans, lower leg
M07.17|Arthritis mutilans, ankle and foot
M07.18|Arthritis mutilans, other sites
M07.19|Arthritis mutilans, unspecified site
M07.2|Psoriatic spondylitis
M07.3|Other psoriatic arthropathies
M07.30|Other psoriatic arthropathies, multiple sites
M07.31|Other psoriatic arthropathies, sholder region
M07.32|Other psoriatic arthropathies, upper arm
M07.33|Other psoriatic arthropathies, forearm
M07.34|Other psoriatic arthropathies, hand
M07.35|Other psoriatic arthropathies, pelvic and thigh
M07.36|Other psoriatic arthropathies, lower leg
M07.37|Other psoriatic arthropathies, ankle and foot
M07.38|Other psoriatic arthropathies, other sites
M07.39|Other psoriatic arthropathies, unspecified site
M07.4|Arthropathy in crohn's disease [regional enteritis]
M07.40|Arthropathy in crohn's disease [regional enteritis], multiple sites
M07.41|Arthropathy in crohn's disease [regional enteritis], shoulder region
M07.42|Arthropathy in crohn's disease [regional enteritis], upper arm
M07.43|Arthropathy in crohn's disease [regional enteritis], forearm
M07.44|Arthropathy in crohn's disease [regional enteritis], hand
M07.45|Arthropathy in crohn's disease [regional enteritis], pelvic and thigh
M07.46|Arthropathy in crohn's disease [regional enteritis], lower leg
M07.47|Arthropathy in crohn's disease [regional enteritis], ankle and foot
M07.48|Arthropathy in crohn's disease [regional enteritis], other sites
M07.49|Arthropathy in crohn's disease [regional enteritis], unspecified site
M07.5|Arthropathy in ulcerative colitis
M07.50|Arthropathy in ulcerative colitis, multiple sites
M07.51|Arthropathy in ulcerative colitis, shoulder region
M07.52|Arthropathy in ulcerative colitis, upper arm
M07.53|Arthropathy in ulcerative colitis, forearm
M07.54|Arthropathy in ulcerative colitis, hand
M07.55|Arthropathy in ulcerative colitis, pelvic and thigh
M07.56|Arthropathy in ulcerative colitis, lower leg
M07.57|Arthropathy in ulcerative colitis, ankle and foot
M07.58|Arthropathy in ulcerative colitis, other sites
M07.59|Arthropathy in ulcerative colitis, unspecified site
M07.6|Other enteropathic arthropathies
M07.60|Other enteropathic arthropathies, multiple sites
M07.61|Other enteropathic arthropathies, shoulder region
M07.62|Other enteropathic arthropathies, upper arm
M07.63|Other enteropathic arthropathies, forearm
M07.64|Other enteropathic arthropathies, hand
M07.65|Other enteropathic arthropathies, pelvic and thigh
M07.66|Other enteropathic arthropathies, lower leg
M07.67|Other enteropathic arthropathies, ankle and foot
M07.68|Other enteropathic arthropathies, other sites
M07.69|Other enteropathic arthropathies, unspecified site
M08|Juvenile arthritis
M08.0|Juvenile rheumatoid arthritis
M08.00|Juvenile rheumatoid arthritis, multiple sites
M08.01|Juvenile rheumatoid arthritis, shoulder region
M08.02|Juvenile rheumatoid arthritis, upper arm
M08.03|Juvenile rheumatoid arthritis, forearm
M08.04|Juvenile rheumatoid arthritis, hand
M08.05|Juvenile rheumatoid arthritis, pelvic and thigh
M08.06|Juvenile rheumatoid arthritis, lower leg
M08.07|Juvenile rheumatoid arthritis, ankle and foot
M08.08|Juvenile rheumatoid arthritis, other sites
M08.09|Juvenile rheumatoid arthritis, unspecified site
M08.1|Juvenile ankylosing spondylitis
M08.10|Juvenile ankylosing spondylitis, multiple sites
M08.11|Juvenile ankylosing spondylitis, shouder region
M08.12|Juvenile ankylosing spondylitis, upper arm
M08.13|Juvenile ankylosing spondylitis, forearm
M08.14|Juvenile ankylosing spondylitis, hand
M08.15|Juvenile ankylosing spondylitis, pelvic and thigh
M08.16|Juvenile ankylosing spondylitis, lower leg
M08.17|Juvenile ankylosing spondylitis, ankle and foot
M08.18|Juvenile ankylosing spondylitis, other sites
M08.19|Juvenile ankylosing spondylitis, unspecified site
M08.2|Juvenile arthritis with systemic onset
M08.20|Juvenile arthritis with systemic onset, multiple sites
M08.21|Juvenile arthritis with systemic onset, shoulder region
M08.22|Juvenile arthritis with systemic onset, upper arm
M08.23|Juvenile arthritis with systemic onset, forearm
M08.24|Juvenile arthritis with systemic onset, hand
M08.25|Juvenile arthritis with systemic onset, pelvic and thigh
M08.26|Juvenile arthritis with systemic onset, lower leg
M08.27|Juvenile arthritis with systemic onset, ankle and foot
M08.28|Juvenile arthritis with systemic onset, other sites
M08.29|Juvenile arthritis with systemic onset, unspecified site
M08.3|Juvenile polyarthritis (seronegative)
M08.30|Juvenile polyarthritis (seronegative), multiple sites
M08.31|Juvenile polyarthritis (seronegative), shoulder region
M08.32|Juvenile polyarthritis (seronegative), upper arm
M08.33|Juvenile polyarthritis (seronegative), forearm
M08.34|Juvenile polyarthritis (seronegative), hand
M08.35|Juvenile polyarthritis (seronegative), pelvic and thigh
M08.36|Juvenile polyarthritis (seronegative), lower leg
M08.37|Juvenile polyarthritis (seronegative), ankle and foot
M08.38|Juvenile polyarthritis (seronegative), other sites
M08.39|Juvenile polyarthritis (seronegative), unspecified site
M08.4|Pauciarticular juvenile arthritis
M08.40|Pauciarticular juvenile arthritis, multiple sites
M08.41|Pauciarticular juvenile arthritis, shoulder region
M08.42|Pauciarticular juvenile arthritis, upper arm
M08.43|Pauciarticular juvenile arthritis, forearm
M08.44|Pauciarticular juvenile arthritis, hand
M08.45|Pauciarticular juvenile arthritis, pelvica and thigh
M08.46|Pauciarticular juvenile arthritis, lower leg
M08.47|Pauciarticular juvenile arthritis, ankle and foot
M08.48|Pauciarticular juvenile arthritis, other sites
M08.49|Pauciarticular juvenile arthritis, unspecified site
M08.8|Other juvenile arthritis
M08.80|Other juvenile arthritis, multiple sites
M08.81|Other juvenile arthritis, shoulder region
M08.82|Other juvenile arthritis, upper arm
M08.83|Other juvenile arthritis, forearm
M08.84|Other juvenile arthritis, hand
M08.85|Other juvenile arthritis, pelvic and thigh
M08.86|Other juvenile arthritis, lower leg
M08.87|Other juvenile arthritis, ankle and foot
M08.88|Other juvenile arthritis, other sites
M08.89|Other juvenile arthritis, unspecified site
M08.9|Juvenile arthritis, unspecified
M08.90|Juvenile arthritis, unspecified, multiple sites
M08.91|Juvenile arthritis, unspecified, shoulder region
M08.92|Juvenile arthritis, unspecified, upper arm
M08.93|Juvenile arthritis, unspecified, forearm
M08.94|Juvenile arthritis, unspecified, hand
M08.95|Juvenile arthritis, unspecified, pelvic and thigh
M08.96|Juvenile arthritis, unspecified, lower leg
M08.97|Juvenile arthritis, unspecified, ankle and foot
M08.98|Juvenile arthritis, unspecified, other sites
M08.99|Juvenile arthritis, unspecified, unspecified site
M09|Juvenile arthritis in diseases classified elsewhere
M09.0|Juvenile arthritis in psoriasis
M09.00|Juvenile arthritis in psoriasis, multiple sites
M09.01|Juvenile arthritis in psoriasis, shoulder region
M09.02|Juvenile arthritis in psoriasis, upper arm
M09.03|Juvenile arthritis in psoriasis, forearm
M09.04|Juvenile arthritis in psoriasis, hand
M09.05|Juvenile arthritis in psoriasis, pelvic and thigh
M09.06|Juvenile arthritis in psoriasis, lower leg
M09.07|Juvenile arthritis in psoriasis, ankle and foot
M09.08|Juvenile arthritis in psoriasis, other sites
M09.09|Juvenile arthritis in psoriasis, unspecified site
M09.1|Juvenile arthritis in crohn's disease [regional enteritis]
M09.10|Juvenile arthritis in crohn's disease [regional enteritis], multiple sites
M09.11|Juvenile arthritis in crohn's disease [regional enteritis], shoulder region
M09.12|Juvenile arthritis in crohn's disease [regional enteritis], upper arm
M09.13|Juvenile arthritis in crohn's disease [regional enteritis], forearm
M09.14|Juvenile arthritis in crohn's disease [regional enteritis], hand
M09.15|Juvenile arthritis in crohn's disease [regional enteritis], pelvic and thigh
M09.16|Juvenile arthritis in crohn's disease [regional enteritis], lower leg
M09.17|Juvenile arthritis in crohn's disease [regional enteritis], ankle and foot
M09.18|Juvenile arthritis in crohn's disease [regional enteritis], other sites
M09.19|Juvenile arthritis in crohn's disease [regional enteritis], unspecified site
M09.2|Juvenile arthritis in ulcerative colitis
M09.20|Juvenile arthritis in ulcerative colitis, multiple sites
M09.21|Juvenile arthritis in ulcerative colitis, shoulder region
M09.22|Juvenile arthritis in ulcerative colitis, upper arm
M09.23|Juvenile arthritis in ulcerative colitis, forearm
M09.24|Juvenile arthritis in ulcerative colitis, hand
M09.25|Juvenile arthritis in ulcerative colitis, pelvic and thigh
M09.26|Juvenile arthritis in ulcerative colitis, lower leg
M09.27|Juvenile arthritis in ulcerative colitis, ankle and foot
M09.28|Juvenile arthritis in ulcerative colitis, other sites
M09.29|Juvenile arthritis in ulcerative colitis, unspecified site
M09.8|Juvenile arthritis in other diseases classified elsewhere
M09.80|Juvenile arthritis in other diseases classified elsewhere, multiple sites
M09.81|Juvenile arthritis in other diseases classified elsewhere, shoulder region
M09.82|Juvenile arthritis in other diseases classified elsewhere, upper arm
M09.83|Juvenile arthritis in other diseases classified elsewhere, forearm
M09.84|Juvenile arthritis in other diseases classified elsewhere, hand
M09.85|Juvenile arthritis in other diseases classified elsewhere, pelvic and thigh
M09.86|Juvenile arthritis in other diseases classified elsewhere, lower leg
M09.87|Juvenile arthritis in other diseases classified elsewhere, ankle and foot
M09.88|Juvenile arthritis in other diseases classified elsewhere, other sites
M09.89|Juvenile arthritis in other diseases classified elsewhere, unspecified site
M10|Gout
M10.0|Idiopathic gout
M10.00|Idiopathic gout, multiple sites
M10.01|Idiopathic gout, shoulder region
M10.02|Idiopathic gout, upper arm
M10.03|Idiopathic gout, forearm
M10.04|Idiopathic gout, hand
M10.05|Idiopathic gout, pelvic and thigh
M10.06|Idiopathic gout, lower leg
M10.07|Idiopathic gout, ankle and foot
M10.08|Idiopathic gout, other sites
M10.09|Idiopathic gout, unspecified site
M10.1|Lead-induced gout
M10.10|Lead-induced gout, multiple sites
M10.11|Lead-induced gout, shoulder region
M10.12|Lead-induced gout, upper arm
M10.13|Lead-induced gout, forearm
M10.14|Lead-induced gout, hand
M10.15|Lead-induced gout, pelvic and thigh
M10.16|Lead-induced gout, lower leg
M10.17|Lead-induced gout, ankle and foot
M10.18|Lead-induced gout, other sites
M10.19|Lead-induced gout, unspecified site
M10.2|Drug-induced gout
M10.20|Drug-induced gout, multiple sites
M10.21|Drug-induced gout, shoulder region
M10.22|Drug-induced gout, upper arm
M10.23|Drug-induced gout, forearm
M10.24|Drug-induced gout, hand
M10.25|Drug-induced gout, pelvic and thigh
M10.26|Drug-induced gout, lower leg
M10.27|Drug-induced gout, ankle and foot
M10.28|Drug-induced gout, other sites
M10.29|Drug-induced gout, unspecified site
M10.3|Gout due to impairment of renal function
M10.30|Gout due to impairment of renal function, multiple sites
M10.31|Gout due to impairment of renal function, shoulder region
M10.32|Gout due to impairment of renal function, upper arm
M10.33|Gout due to impairment of renal function, forearm
M10.34|Gout due to impairment of renal function, hand
M10.35|Gout due to impairment of renal function, pelvic and thigh
M10.36|Gout due to impairment of renal function, lower leg
M10.37|Gout due to impairment of renal function, ankle and foot
M10.38|Gout due to impairment of renal function, other sites
M10.39|Gout due to impairment of renal function, unspecified site
M10.4|Other secondary gout
M10.40|Other secondary gout, multiple sites
M10.41|Other secondary gout, shoulder region
M10.42|Other secondary gout, upper arm
M10.43|Other secondary gout, forearm
M10.44|Other secondary gout, hand
M10.45|Other secondary gout, pelvic and thigh
M10.46|Other secondary gout, lower leg
M10.47|Other secondary gout, ankle and foot
M10.48|Other secondary gout, other sites
M10.49|Other secondary gout, unspecified site
M10.9|Gout, unspecified
M10.90|Gout, unspecified, multiple sites
M10.91|Gout, unspecified, shoulder region
M10.92|Gout, unspecified, upper arm
M10.93|Gout, unspecified, forearm
M10.94|Gout, unspecified, hand
M10.95|Gout, unspecified, pelvic and thigh
M10.96|Gout, unspecified, lower leg
M10.97|Gout, unspecified, ankle and foot
M10.98|Gout, unspecified, other sites
M10.99|Gout, unspecified, unspecified site
M11|Other crystal arthropathies
M11.0|Hydroxyapatite deposition disease
M11.00|Hydroxyapatite deposition disease, multiple sites
M11.01|Hydroxyapatite deposition disease, shoulder region
M11.02|Hydroxyapatite deposition disease, upper arm
M11.03|Hydroxyapatite deposition disease, forearm
M11.04|Hydroxyapatite deposition disease, hand
M11.05|Hydroxyapatite deposition disease, pelvic and thigh
M11.06|Hydroxyapatite deposition disease, lower leg
M11.07|Hydroxyapatite deposition disease, ankle and foot
M11.08|Hydroxyapatite deposition disease, other sites
M11.09|Hydroxyapatite deposition disease, unspecified site
M11.1|Familial chondrocalcinosis
M11.10|Familial chondrocalcinosis, multiple sites
M11.11|Familial chondrocalcinosis, shoulder region
M11.12|Familial chondrocalcinosis, upper arm
M11.13|Familial chondrocalcinosis, forearm
M11.14|Familial chondrocalcinosis, hand
M11.15|Familial chondrocalcinosis, pelvic and thigh
M11.16|Familial chondrocalcinosis, lower leg
M11.17|Familial chondrocalcinosis, ankle and foot
M11.18|Familial chondrocalcinosis, other sites
M11.19|Familial chondrocalcinosis, unspecified site
M11.2|Other chondrocalcinosis
M11.20|Other chondrocalcinosis, multiple sites
M11.21|Other chondrocalcinosis, shoulder region
M11.22|Other chondrocalcinosis, upper arm
M11.23|Other chondrocalcinosis, forearm
M11.24|Other chondrocalcinosis, hand
M11.25|Other chondrocalcinosis, pelvic and thigh
M11.26|Other chondrocalcinosis, lower leg
M11.27|Other chondrocalcinosis, ankle and foot
M11.28|Other chondrocalcinosis, other sites
M11.29|Other chondrocalcinosis, unspecified site
M11.8|Other specified crystal arthropathies
M11.80|Other specified crystal arthropathies, multiple sites
M11.81|Other specified crystal arthropathies, shoulder region
M11.82|Other specified crystal arthropathies, upper arm
M11.83|Other specified crystal arthropathies, forearm
M11.84|Other specified crystal arthropathies, hand
M11.85|Other specified crystal arthropathies, pelvic and thigh
M11.86|Other specified crystal arthropathies, lower leg
M11.87|Other specified crystal arthropathies, ankle and foot
M11.88|Other specified crystal arthropathies, other sites
M11.89|Other specified crystal arthropathies, unspecified site
M11.9|Crystal arthropathy, unspecified
M11.90|Crystal arthropathy, unspecified, multiple sites
M11.91|Crystal arthropathy, unspecified, shoulder region
M11.92|Crystal arthropathy, unspecified, upper arm
M11.93|Crystal arthropathy, unspecified, forearm
M11.94|Crystal arthropathy, unspecified, hand
M11.95|Crystal arthropathy, unspecified, pelvic and thigh
M11.96|Crystal arthropathy, unspecified, lower leg
M11.97|Crystal arthropathy, unspecified, ankle and foot
M11.98|Crystal arthropathy, unspecified, other sites
M11.99|Crystal arthropathy, unspecified, unspecified site
M12|Other specific arthropathies
M12.0|Chronic postrheumatic arthropathy [jaccoud]
M12.00|Chronic postrheumatic arthropathy [jaccoud], multiple sites
M12.01|Chronic postrheumatic arthropathy [jaccoud], shoulder region
M12.02|Chronic postrheumatic arthropathy [jaccoud], upper arm
M12.03|Chronic postrheumatic arthropathy [jaccoud], forearm
M12.04|Chronic postrheumatic arthropathy [jaccoud], hand
M12.05|Chronic postrheumatic arthropathy [jaccoud], pelvic and thigh
M12.06|Chronic postrheumatic arthropathy [jaccoud], lower leg
M12.07|Chronic postrheumatic arthropathy [jaccoud], ankle and foot
M12.08|Chronic postrheumatic arthropathy [jaccoud], other sites
M12.09|Chronic postrheumatic arthropathy [jaccoud], unspecified site
M12.1|Kaschin-beck disease
M12.10|Kaschin-beck disease, multiple sites
M12.11|Kaschin-beck disease, shoulder region
M12.12|Kaschin-beck disease, upper arm
M12.13|Kaschin-beck disease, forearm
M12.14|Kaschin-beck disease, hand
M12.15|Kaschin-beck disease, pelvic and thigh
M12.16|Kaschin-beck disease, lower leg
M12.17|Kaschin-beck disease, ankle and foot
M12.18|Kaschin-beck disease, other sites
M12.19|Kaschin-beck disease, unspecified site
M12.2|Villonodular synovitis (pigmented)
M12.20|Villonodular synovitis (pigmented), multiple sites
M12.21|Villonodular synovitis (pigmented), shoulder region
M12.22|Villonodular synovitis (pigmented), upper arm
M12.23|Villonodular synovitis (pigmented), forearm
M12.24|Villonodular synovitis (pigmented), hand
M12.25|Villonodular synovitis (pigmented), pelvic and thigh
M12.26|Villonodular synovitis (pigmented), lower leg
M12.27|Villonodular synovitis (pigmented), ankle and foot
M12.28|Villonodular synovitis (pigmented), other sites
M12.29|Villonodular synovitis (pigmented), unspecified site
M12.3|Palindromic rheumatism
M12.30|Palindromic rheumatism, multiple sites
M12.31|Palindromic rheumatism, shoulder region
M12.32|Palindromic rheumatism, upper arm
M12.33|Palindromic rheumatism, forearm
M12.34|Palindromic rheumatism, hand
M12.35|Palindromic rheumatism, pelvic and thigh
M12.36|Palindromic rheumatism, lower leg
M12.37|Palindromic rheumatism, ankle and foot
M12.38|Palindromic rheumatism, other sites
M12.39|Palindromic rheumatism, unspecified site
M12.4|Intermittent hydrarthrosis
M12.40|Intermittent hydrarthrosis, multiple sites
M12.41|Intermittent hydrarthrosis, shoulder region
M12.42|Intermittent hydrarthrosis, upper arm
M12.43|Intermittent hydrarthrosis, forearm
M12.44|Intermittent hydrarthrosis, hand
M12.45|Intermittent hydrarthrosis,  pelvic and thigh
M12.46|Intermittent hydrarthrosis, lower leg
M12.47|Intermittent hydrarthrosis, ankle and foot
M12.48|Intermittent hydrarthrosis, other sites
M12.49|Intermittent hydrarthrosis, unspecified site
M12.5|Traumatic arthropathy
M12.50|Traumatic arthropathy, multiple sites
M12.51|Traumatic arthropathy, shoulder region
M12.52|Traumatic arthropathy, upper arm
M12.53|Traumatic arthropathy, forearm
M12.54|Traumatic arthropathy, hand
M12.55|Traumatic arthropathy, pelvic and thigh
M12.56|Traumatic arthropathy, lower leg
M12.57|Traumatic arthropathy, ankle and foot
M12.58|Traumatic arthropathy, other sites
M12.59|Traumatic arthropathy, unspecified site
M12.8|Other specific arthropathies, not elsewhere classified
M12.80|Other specific arthropathies, not elsewhere classified, multiple sites
M12.81|Other specific arthropathies, not elsewhere classified, shoulder region
M12.82|Other specific arthropathies, not elsewhere classified, upper arm
M12.83|Other specific arthropathies, not elsewhere classified, forearm
M12.84|Other specific arthropathies, not elsewhere classified, hand
M12.85|Other specific arthropathies, not elsewhere classified, pelvic and thigh
M12.86|Other specific arthropathies, not elsewhere classified, lower leg
M12.87|Other specific arthropathies, not elsewhere classified, ankle and foot
M12.88|Other specific arthropathies, not elsewhere classified, other sites
M12.89|Other specific arthropathies, not elsewhere classified, unspecified site
M13|Other arthritis
M13.0|Polyarthritis, unspecified
M13.00|Polyarthritis, unspecified, multiple sites
M13.01|Polyarthritis, unspecified, shoulder region
M13.02|Polyarthritis, unspecified, upper arm
M13.03|Polyarthritis, unspecified, forearm
M13.04|Polyarthritis, unspecified, hand
M13.05|Polyarthritis, unspecified, pelvic and thigh
M13.06|Polyarthritis, unspecified, lower leg
M13.07|Polyarthritis, unspecified, ankle and foot
M13.08|Polyarthritis, unspecified, other sites
M13.09|Polyarthritis, unspecified, unspecified site
M13.1|Monoarthritis, not elsewhere classified
M13.10|Monoarthritis, not elsewhere classified, multiple sites
M13.11|Monoarthritis, not elsewhere classified, shoulder region
M13.12|Monoarthritis, not elsewhere classified, upper arm
M13.13|Monoarthritis, not elsewhere classified, forearm
M13.14|Monoarthritis, not elsewhere classified, hand
M13.15|Monoarthritis, not elsewhere classified, pelvic and thigh
M13.16|Monoarthritis, not elsewhere classified, lower leg
M13.17|Monoarthritis, not elsewhere classified, ankle and foot
M13.18|Monoarthritis, not elsewhere classified, other sites
M13.19|Monoarthritis, not elsewhere classified, unspecified site
M13.8|Other specified arthritis
M13.80|Other specified arthritis, multiple sites
M13.81|Other specified arthritis, shoulder region
M13.82|Other specified arthritis, upper arm
M13.83|Other specified arthritis, forearm
M13.84|Other specified arthritis, hand
M13.85|Other specified arthritis, pelvic and thigh
M13.86|Other specified arthritis, lower leg
M13.87|Other specified arthritis, ankle and foot
M13.88|Other specified arthritis, other sites
M13.89|Other specified arthritis, unspecified site
M13.9|Arthritis, unspecified
M13.90|Arthritis, unspecified, multiple sites
M13.91|Arthritis, unspecified, shoulder region
M13.92|Arthritis, unspecified, upper arm
M13.93|Arthritis, unspecified, forearm
M13.94|Arthritis, unspecified, hand
M13.95|Arthritis, unspecified, pelvic and thigh
M13.96|Arthritis, unspecified, lower leg
M13.97|Arthritis, unspecified, ankle and foot
M13.98|Arthritis, unspecified, other sites
M13.99|Arthritis, unspecified, unspecified site
M14|Arthropathies in other diseases classified elsewhere
M14.0|Gouty arthropathy due to enzyme defects and other inherited disorders
M14.1|Crystal arthropathy in other metabolic disorders
M14.2|Diabetic arthropathy
M14.3|Lipoid dermatoarthritis
M14.4|Arthropathy in amylodosis
M14.5|Arthropathies in other endocrine nutritional and metabolic disorders
M14.6|Neuropathic arthropathy
M14.8|Arthropathies in other specified diseases classified elsewhere
M15|Polyarthrosis
M15.0|Primary generalized (osteo)arthrosis
M15.1|Heberden's nodes (with arthropathy)
M15.2|Bouchard's nodes (with arthropathy)
M15.3|Secondary multiple arthrosis
M15.4|Erosive (osteo)arthrosis
M15.8|Other polyarthrosis
M15.9|Polyarthrosis, unspecified
M16|Coxarthrosis [arthrosis of hip]
M16.0|Primary coxarthrosis, bilateral
M16.1|Other primary coxarthrosis
M16.2|Coxarthrosis resulting from dysplasia, bilateral
M16.3|Other dysplastic coxarthrosis
M16.4|Post-traumatic coxarthrosis, bilateral
M16.5|Other post-traumatic coxarthrosis
M16.6|Other secondary coxarthrosis, bilateral
M16.7|Other secondary coxarthrosis
M16.9|Coxarthrosis, unspecified
M17|Gonarthrosis [arthrosis of knee]
M17.0|Primary gonarthrosis, bilateral
M17.1|Other primary gonarthrosis
M17.2|Post-traumatic gonarthrosis, bilateral
M17.3|Other post-traumatic gonarthrosis
M17.4|Other secondary gonarthrosis, bilateral
M17.5|Other secondary gonarthrosis
M17.9|Gonarthrosis, unspecified
M18|Arthrosis of first carpometacarpal joint
M18.0|Primary arthrosis of first carpometacarpal joints, bilateral
M18.1|Other primary arthrosis of first carpometacarpal joint
M18.2|Post-traumatic arthrosis of first carpometacarpal joints, bilateral
M18.3|Other post-traumatic arthrosis of first carpometacarpal joints
M18.4|Other secondary arthrosis of first carpometacarpal joints, bilateral
M18.5|Other secondary arthrosis of first carpometacarpal joint
M18.9|Arthrosis of first carpometacarpal joint, unspecified
M19|Other arthrosis
M19.0|Primary arthrosis of other joints
M19.00|Primary arthrosis of other joints, multiple sites
M19.01|Primary arthrosis of other joints, shoulder region
M19.02|Primary arthrosis of other joints, upper arm
M19.03|Primary arthrosis of other joints, forearm
M19.04|Primary arthrosis of other joints, hand
M19.05|Primary arthrosis of other joints, pelvic and thigh
M19.06|Primary arthrosis of other joints, lower leg
M19.07|Primary arthrosis of other joints, ankle and foot
M19.08|Primary arthrosis of other joints, other sites
M19.09|Primary arthrosis of other joints, unspecified site
M19.1|Post-traumatic arthrosis of other joints
M19.10|Post-traumatic arthrosis of other joints, multiple sites
M19.11|Post-traumatic arthrosis of other joints, shoulder region
M19.12|Post-traumatic arthrosis of other joints, upper arm
M19.13|Post-traumatic arthrosis of other joints, forearm
M19.14|Post-traumatic arthrosis of other joints, hand
M19.15|Post-traumatic arthrosis of other joints, pelvic and thigh
M19.16|Post-traumatic arthrosis of other joints, lower leg
M19.17|Post-traumatic arthrosis of other joints, ankle and foot
M19.18|Post-traumatic arthrosis of other joints, other sites
M19.19|Post-traumatic arthrosis of other joints, unspecified site
M19.2|Secondary arthrosis of other joints
M19.20|Secondary arthrosis of other joints, multiple sites
M19.21|Secondary arthrosis of other joints, shoulder region
M19.22|Secondary arthrosis of other joints, upper arm
M19.23|Secondary arthrosis of other joints, forearm
M19.24|Secondary arthrosis of other joints, hand
M19.25|Secondary arthrosis of other joints, pelvic and thigh
M19.26|Secondary arthrosis of other joints, lower leg
M19.27|Secondary arthrosis of other joints, ankle and foot
M19.28|Secondary arthrosis of other joints, other sites
M19.29|Secondary arthrosis of other joints, unspecified site
M19.8|Other specified arthrosis
M19.80|Other specified arthrosis, multiple sites
M19.81|Other specified arthrosis, shoulder region
M19.82|Other specified arthrosis, upper arm
M19.83|Other specified arthrosis, forearm
M19.84|Other specified arthrosis, hand
M19.85|Other specified arthrosis, pelvic and thigh
M19.86|Other specified arthrosis, lower leg
M19.87|Other specified arthrosis, ankle and foot
M19.88|Other specified arthrosis, other sites
M19.89|Other specified arthrosis, unspecified site
M19.9|Arthrosis, unspecified
M19.90|Arthrosis, unspecified, multiple sites
M19.91|Arthrosis, unspecified, shouder region
M19.92|Arthrosis, unspecified, upper arm
M19.93|Arthrosis, unspecified, forearm
M19.94|Arthrosis, unspecified, hand
M19.95|Arthrosis, unspecified, pelvic and thigh
M19.96|Arthrosis, unspecified, lower leg
M19.97|Arthrosis, unspecified, ankle and foot
M19.98|Arthrosis, unspecified, other sites
M19.99|Arthrosis, unspecified, unspecified site
M20|Acquired deformities of fingers and toes
M20.0|Deformity of finger(s)
M20.1|Hallux valgus (acquired)
M20.2|Hallux rigidus
M20.3|Other deformity of hallux (acquired)
M20.4|Other hammer toe(s) (acquired)
M20.5|Other deformities of toe(s) (acquired)
M20.6|Acquired deformity of toe(s), unspecified
M21|Other acquired deformities of limbs
M21.0|Valgus deformity, not elsewhere classified
M21.00|Valgus deformity, not elsewhere classified, multiple sites
M21.01|Valgus deformity, not elsewhere classified, shoulder region
M21.02|Valgus deformity, not elsewhere classified, upper arm
M21.03|Valgus deformity, not elsewhere classified, forearm
M21.04|Valgus deformity, not elsewhere classified, hand
M21.05|Valgus deformity, not elsewhere classified, pelvic and thigh
M21.06|Valgus deformity, not elsewhere classified, lower leg
M21.07|Valgus deformity, not elsewhere classified, ankle and foot
M21.08|Valgus deformity, not elsewhere classified, other sites
M21.09|Valgus deformity, not elsewhere classified, unspecified site
M21.1|Varus deformity, not elsewhere classified
M21.10|Varus deformity, not elsewhere classified, multiple sites
M21.11|Varus deformity, not elsewhere classified, shoulder region
M21.12|Varus deformity, not elsewhere classified, upper arm
M21.13|Varus deformity, not elsewhere classified, forearm
M21.14|Varus deformity, not elsewhere classified, hand
M21.15|Varus deformity, not elsewhere classified, pelvic and thigh
M21.16|Varus deformity, not elsewhere classified, lower leg
M21.17|Varus deformity, not elsewhere classified, ankle and foot
M21.18|Varus deformity, not elsewhere classified, other sites
M21.19|Varus deformity, not elsewhere classified, unspecified site
M21.2|Flexion deformity
M21.20|Flexion deformity, multiple sites
M21.21|Flexion deformity, shoulder region
M21.22|Flexion deformity, upper arm
M21.23|Flexion deformity, forearm
M21.24|Flexion deformity, hand
M21.25|Flexion deformity, pelvic and thigh
M21.26|Flexion deformity, lower leg
M21.27|Flexion deformity, ankle and foot
M21.28|Flexion deformity, other sites
M21.29|Flexion deformity, unspecified site
M21.3|Wrist or foot drop (acquired)
M21.34|Wrist or foot drop (acquired), hand
M21.37|Wrist or foot drop (acquired), ankle and foot
M21.4|Flat foot [pes planus] (acquired)
M21.47|Flat foot [pes planus] (acquired), ankle and foot
M21.5|Acquired clawhand, clubhand, clawfoot and clubfoot
M21.54|Acquired clawhand, clubhand, clawfoot and clubfoot, hand
M21.57|Acquired clawhand, clubhand, clawfoot and clubfoot, ankle and foot
M21.6|Other acquired deformities of ankle and foot
M21.67|Other acquired deformities of ankle and foot, ankle and foot
M21.7|Unequal limb length (acquired)
M21.70|Unequal limb length (acquired), multiple sites
M21.71|Unequal limb length (acquired), shoulder region
M21.72|Unequal limb length (acquired), upper arm
M21.73|Unequal limb length (acquired), forearm
M21.74|Unequal limb length (acquired), hand
M21.75|Unequal limb length (acquired), pelvic and thigh
M21.76|Unequal limb length (acquired), lower leg
M21.77|Unequal limb length (acquired), ankle and foot
M21.78|Unequal limb length (acquired), other sites
M21.79|Unequal limb length (acquired), unspecified site
M21.8|Other specified acquired deformities of limbs
M21.80|Other specified acquired deformities of limbs, multiple sites
M21.81|Other specified acquired deformities of limbs, shoulder region
M21.82|Other specified acquired deformities of limbs, upper arm
M21.83|Other specified acquired deformities of limbs, forearm
M21.84|Other specified acquired deformities of limbs, hand
M21.85|Other specified acquired deformities of limbs, pelvic and thigh
M21.86|Other specified acquired deformities of limbs, lower leg 1
M21.87|Other specified acquired deformities of limbs, ankle and foot 1
M21.88|Other specified acquired deformities of limbs, other sites 1
M21.89|Other specified acquired deformities of limbs, unspecified site 1
M21.9|Acquired deformity of limb, unspecified 1
M21.90|Acquired deformity of limb, unspecified, multiple sites 1
M21.91|Acquired deformity of limb, unspecified, shoulder region 1
M21.92|Acquired deformity of limb, unspecified, upper arm 1
M21.93|Acquired deformity of limb, unspecified, forearm 1
M21.94|Acquired deformity of limb, unspecified, hand 1
M21.95|Acquired deformity of limb, unspecified, pelvic and thigh 1
M21.96|Acquired deformity of limb, unspecified, lower leg 1
M21.97|Acquired deformity of limb, unspecified, ankle and foot 1
M21.98|Acquired deformity of limb, unspecified, other sites 1
M21.99|Acquired deformity of limb, unspecified, unspecified site 1
M22|Disorders of patella
M22.0|Recurrent dislocation of patella 1
M22.1|Recurrent subluxation of patella 1
M22.2|Patellofemoral disorders 1
M22.3|Other derangements of patella 1
M22.4|Chondromalacia patellae
M22.8|Other disorders of patella
M22.9|Disorder of patella, unspecified
M23|Internal derangement of knee
M23.0|Cystic meniscus
M23.00|Cystic meniscus, multiple sites
M23.01|Cystic meniscus, anterior cruciate ligament or anterior horn medial meniscus
M23.02|Cystic meniscus, posterior cruciate ligament or anterior horn medial meniscus
M23.03|Cystic meniscus, medial collateral ligament or other and unspecified medial meniscus
M23.04|Cystic meniscus, lateral collateral ligament or anterior horn of lateral meniscus
M23.05|Cystic meniscus, posterior horn of lateral meniscus
M23.06|Cystic meniscus, other and unspecified lateral meniscus
M23.07|Cystic meniscus, capsular ligament
M23.09|Cystic meniscus, unspecified ligament or unspecified meniscus
M23.1|Discoid meniscus (congenital)
M23.10|Discoid meniscus (congenital), multiple sites
M23.11|Discoid meniscus (congenital), anterior cruciate ligament or anterior horn medial meniscus
M23.12|Discoid meniscus (congenital), posterior cruciate ligament or anterior horn medial meniscus
M23.13|Discoid meniscus (congenital), medial collateral ligament or other and unspecified medial meniscus
M23.14|Discoid meniscus (congenital), lateral collateral ligament or anterior horn of lateral meniscus
M23.15|Discoid meniscus (congenital), posterior horn of lateral meniscus
M23.16|Discoid meniscus (congenital), other and unspecified lateral meniscus
M23.17|Discoid meniscus (congenital),capsular ligament
M23.19|Discoid meniscus (congenital), unspecified ligament or unspecified meniscus
M23.2|Derangement of meniscus due to old tear or injury
M23.20|Derangement of meniscus due to old tear or injury, multiple sites
M23.21|Derangement of meniscus due to old tear or injury, anterior cruciate ligament or anterior horn medial meniscus
M23.22|Derangement of meniscus due to old tear or injury, posterior cruciate ligament or anterior horn medial meniscus
M23.23|Derangement of meniscus due to old tear or injury, medial collateral ligament or other and unspecified medial meniscus
M23.24|Derangement of meniscus due to old tear or injury, lateral collateral ligament or anterior horn of lateral meniscus
M23.25|Derangement of meniscus due to old tear or injury, posterior horn of lateral meniscus
M23.26|Derangement of meniscus due to old tear or injury, other and unspecified lateral meniscus
M23.27|Derangement of meniscus due to old tear or injury, capsular ligament
M23.29|Derangement of meniscus due to old tear or injury, unspecified ligament or unspecified meniscus
M23.3|Other meniscus derangements
M23.30|Other meniscus derangements, multiple sites
M23.31|Other meniscus derangements, anterior cruciate ligament or anterior horn medial meniscus
M23.32|Other meniscus derangements, posterior cruciate ligament or anterior horn medial meniscus
M23.33|Other meniscus derangements, medial collateral ligament or other and unspecified medial meniscus
M23.34|Other meniscus derangements, lateral collateral ligament or anterior horn of lateral meniscus
M23.35|Other meniscus derangements, posterior horn of lateral meniscus
M23.36|Other meniscus derangements, other and unspecified lateral meniscus
M23.37|Other meniscus derangements, capsular ligament
M23.39|Other meniscus derangements, unspecified ligament or unspecified meniscus
M23.4|Loose body in knee
M23.40|Loose body in knee, multiple sites
M23.41|Loose body in knee, anterior cruciate ligament or anterior horn medial meniscus
M23.42|Loose body in knee, posterior cruciate ligament or anterior horn medial meniscus
M23.43|Loose body in knee, medial collateral ligament or other and unspecified medial meniscus
M23.44|Loose body in knee, lateral collateral ligament or anterior horn of lateral meniscus
M23.45|Loose body in knee, posterior horn of lateral meniscus
M23.46|Loose body in knee, other and unspecified lateral meniscus
M23.47|Loose body in knee, capsular ligament
M23.49|Loose body in knee, unspecified ligament or unspecified meniscus
M23.5|Chronic instability of knee
M23.50|Chronic instability of knee, multiple sites
M23.51|Chronic instability of knee, anterior cruciate ligament or anterior horn medial meniscus
M23.52|Chronic instability of knee, posterior cruciate ligament or anterior horn medial meniscus
M23.53|Chronic instability of knee, medial collateral ligament or other and unspecified medial meniscus
M23.54|Chronic instability of knee, lateral collateral ligament or anterior horn of lateral meniscus
M23.55|Chronic instability of knee, posterior horn of lateral meniscus
M23.56|Chronic instability of knee, other and unspecified lateral meniscus
M23.57|Chronic instability of knee, capsular ligament
M23.59|Chronic instability of knee, unspecified ligament or unspecified meniscus
M23.6|Other spontaneous disruption of ligament(s) of knee
M23.60|Other spontaneous disruption of ligament(s) of knee, multiple sites
M23.61|Other spontaneous disruption of ligament(s) of knee, anterior cruciate ligament or anterior horn medial meniscus
M23.62|Other spontaneous disruption of ligament(s) of knee, posterior cruciate ligament or anterior horn medial meniscus
M23.63|Other spontaneous disruption of ligament(s) of knee, medial collateral ligament or other and unspecified medial meniscus
M23.64|Other spontaneous disruption of ligament(s) of knee, lateral collateral ligament or anterior horn of lateral meniscus
M23.65|Other spontaneous disruption of ligament(s) of knee, posterior horn of lateral meniscus
M23.66|Other spontaneous disruption of ligament(s) of knee, other and unspecified lateral meniscus
M23.67|Other spontaneous disruption of ligament(s) of knee, capsular ligament
M23.69|Other spontaneous disruption of ligament(s) of knee, unspecified ligament or unspecified meniscus
M23.8|Other internal derangements of knee
M23.80|Other internal derangements of knee, multiple sites
M23.81|Other internal derangements of knee, anterior cruciate ligament or anterior horn medial meniscus
M23.82|Other internal derangements of knee, posterior cruciate ligament or anterior horn medial meniscus
M23.83|Other internal derangements of knee, medial collateral ligament or other and unspecified medial meniscus
M23.84|Other internal derangements of knee, lateral collateral ligament or anterior horn of lateral meniscus
M23.85|Other internal derangements of knee, posterior horn of lateral meniscus
M23.86|Other internal derangements of knee, other and unspecified lateral meniscus
M23.87|Other internal derangements of knee, capsular ligament
M23.89|Other internal derangements of knee, unspecified ligament or unspecified meniscus
M23.9|Internal derangement of knee, unspecified
M23.90|Internal derangement of knee, unspecified, multiple sites
M23.91|Internal derangement of knee, unspecified,anterior cruciate ligament or anterior horn medial meniscus
M23.92|Internal derangement of knee, unspecified, posterior cruciate ligament or anterior horn medial meniscus
M23.93|Internal derangement of knee, unspecified, medial collateral ligament or other and unspecified medial meniscus
M23.94|Internal derangement of knee, unspecified, lateral collateral ligament or anterior horn of lateral meniscus
M23.95|Internal derangement of knee, unspecified, posterior horn of lateral meniscus
M23.96|Internal derangement of knee, unspecified, other and unspecified lateral meniscus
M23.97|Internal derangement of knee, unspecified, capsular ligament
M23.99|Internal derangement of knee, unspecified, unspecified ligament or unspecified meniscus
M24|Other specific joint derangements
M24.0|Loose body in joint
M24.00|Loose body in joint, multiple sites
M24.01|Loose body in joint, shouder region
M24.02|Loose body in joint, upper arm
M24.03|Loose body in joint, forearm
M24.04|Loose body in joint, hand
M24.05|Loose body in joint, pelvic and thigh
M24.06|Loose body in joint, lower leg
M24.07|Loose body in joint, ankle and foot
M24.08|Loose body in joint, other sites
M24.09|Loose body in joint, unspecified site
M24.1|Other articular cartilage disorders
M24.10|Other articular cartilage disorders, multiple sites
M24.11|Other articular cartilage disorders, shoulder region
M24.12|Other articular cartilage disorders, upper arm
M24.13|Other articular cartilage disorders, forearm
M24.14|Other articular cartilage disorders, hand
M24.15|Other articular cartilage disorders, pelvic and thigh
M24.16|Other articular cartilage disorders, lower leg
M24.17|Other articular cartilage disorders, ankle and foot
M24.18|Other articular cartilage disorders, other sites
M24.19|Other articular cartilage disorders, unspecified site
M24.2|Disorder of ligament
M24.20|Disorder of ligament, multiple sites
M24.21|Disorder of ligament, shouder region
M24.22|Disorder of ligament, upper arm
M24.23|Disorder of ligament, forearm
M24.24|Disorder of ligament, hand
M24.25|Disorder of ligament, pelvic and thigh
M24.26|Disorder of ligament, lower leg
M24.27|Disorder of ligament, ankle and foot
M24.28|Disorder of ligament, other sites
M24.29|Disorder of ligament, unspecified site
M24.3|Pathological dislocation and subluxation of joint, not elsewhere classified
M24.30|Pathological dislocation and subluxation of joint not elsewhere classified, multiple sites
M24.31|Pathological dislocation and subluxation of joint not elsewhere classified, shoulder region
M24.32|Pathological dislocation and subluxation of joint not elsewhere classified, upper arm
M24.33|Pathological dislocation and subluxation of joint not elsewhere classified, forearm
M24.34|Pathological dislocation and subluxation of joint not elsewhere classified, hand
M24.35|Pathological dislocation and subluxation of joint not elsewhere classified, pelvic and thigh
M24.36|Pathological dislocation and subluxation of joint not elsewhere classified, lower leg
M24.37|Pathological dislocation and subluxation of joint not elsewhere classified, ankle and foot
M24.38|Pathological dislocation and subluxation of joint not elsewhere classified, other sites
M24.39|Pathological dislocation and subluxation of joint not elsewhere classified, unspecified site
M24.4|Recurrent dislocation and subluxation of joint
M24.40|Recurrent dislocation and subluxation of joint, multiple sites
M24.41|Recurrent dislocation and subluxation of joint, shoulder region
M24.42|Recurrent dislocation and subluxation of joint, upper arm
M24.43|Recurrent dislocation and subluxation of joint, forearm
M24.44|Recurrent dislocation and subluxation of joint, hand
M24.45|Recurrent dislocation and subluxation of joint, pelvic and thigh
M24.46|Recurrent dislocation and subluxation of joint, lower leg
M24.47|Recurrent dislocation and subluxation of joint, ankle and foot
M24.48|Recurrent dislocation and subluxation of joint, other sites
M24.49|Recurrent dislocation and subluxation of joint, unspecified site
M24.5|Contracture of joint
M24.50|Contracture of joint, multiple sites
M24.51|Contracture of joint, shouder region
M24.52|Contracture of joint, upper arm
M24.53|Contracture of joint, forearm
M24.54|Contracture of joint, hand
M24.55|Contracture of joint, pelvic and thigh
M24.56|Contracture of joint, lower leg
M24.57|Contracture of joint, ankle and foot
M24.58|Contracture of joint, other sites
M24.59|Contracture of joint, unspecified site
M24.6|Ankylosis of joint
M24.60|Ankylosis of joint, multiple sites
M24.61|Ankylosis of joint, shoulder region
M24.62|Ankylosis of joint, upper arm
M24.63|Ankylosis of joint, forearm
M24.64|Ankylosis of joint, hand
M24.65|Ankylosis of joint, pelvic and thigh
M24.66|Ankylosis of joint, lower leg
M24.67|Ankylosis of joint, ankle and foot
M24.68|Ankylosis of joint, other sites
M24.69|Ankylosis of joint, unspecified site
M24.7|Protrusio acetabuli
M24.75|Protrusio acetabuli, pelvic andthigh
M24.8|Other specific joint derangements, not elsewhere classified
M24.80|Other specific joint derangements, not elsewhere classified, multiple sites
M24.81|Other specific joint derangements, not elsewhere classified, shoulder region
M24.82|Other specific joint derangements, not elsewhere classified, upper arm
M24.83|Other specific joint derangements, not elsewhere classified, forearm
M24.84|Other specific joint derangements, not elsewhere classified, hand
M24.85|Other specific joint derangements, not elsewhere classified, pelvic and thigh
M24.86|Other specific joint derangements, not elsewhere classified, lower leg
M24.87|Other specific joint derangements, not elsewhere classified, ankle and foot
M24.88|Other specific joint derangements, not elsewhere classified, other sites
M24.89|Other specific joint derangements, not elsewhere classified, unspecified site
M24.9|Joint derangement, unspecified
M24.90|Joint derangement, unspecified, multiple sites
M24.91|Joint derangement, unspecified, shoulder region
M24.92|Joint derangement, unspecified, upper arm
M24.93|Joint derangement, unspecified, forearm
M24.94|Joint derangement, unspecified, hand
M24.95|Joint derangement, unspecified, pelvic and thigh
M24.96|Joint derangement, unspecified, lower leg
M24.97|Joint derangement, unspecified, ankle and foot
M24.98|Joint derangement, unspecified, other sites
M24.99|Joint derangement, unspecified, unspecified site
M25|Other joint disorders, not elsewhere classified
M25.0|Haemarthrosis
M25.00|Haemarthrosis, multiple sites
M25.01|Haemarthrosis, shoulder region
M25.02|Haemarthrosis, upper arm
M25.03|Haemarthrosis, forearm
M25.04|Haemarthrosis, hand
M25.05|Haemarthrosis, pelvic and thigh
M25.06|Haemarthrosis, lower leg
M25.07|Haemarthrosis, ankle and foot
M25.08|Haemarthrosis, other sites
M25.09|Haemarthrosis, unspecified site
M25.1|Fistula of joint
M25.10|Fistula of joint, multiple sites
M25.11|Fistula of joint, shoulder region
M25.12|Fistula of joint, upper arm
M25.13|Fistula of joint, forearm
M25.14|Fistula of joint, hand
M25.15|Fistula of joint, pelvic and thigh
M25.16|Fistula of joint, lower leg
M25.17|Fistula of joint, ankle and foot
M25.18|Fistula of joint, other sites
M25.19|Fistula of joint, unspecified site
M25.2|Flail joint
M25.20|Flail joint, multiple sites
M25.21|Flail joint, shoulder region
M25.22|Flail joint, upper arm
M25.23|Flail joint, forearm
M25.24|Flail joint, hand
M25.25|Flail joint, pelvic and thigh
M25.26|Flail joint, lower leg
M25.27|Flail joint, ankle and foot
M25.28|Flail joint, other sites
M25.29|Flail joint, unspecified site
M25.3|Other instability of joint
M25.30|Other instability of joint, multiple sites
M25.31|Other instability of joint, shoulder region
M25.32|Other instability of joint, upper arm
M25.33|Other instability of joint, forearm
M25.34|Other instability of joint, hand
M25.35|Other instability of joint, pelvic and thigh
M25.36|Other instability of joint, lower leg
M25.37|Other instability of joint, ankle and foot
M25.38|Other instability of joint, other sites
M25.39|Other instability of joint, unspecified site
M25.4|Effusion of joint
M25.40|Effusion of joint, multiple sites
M25.41|Effusion of joint, shoulder region
M25.42|Effusion of joint, upper arm
M25.43|Effusion of joint, forearm
M25.44|Effusion of joint, hand
M25.45|Effusion of joint, pelvic and thigh
M25.46|Effusion of joint, lower leg
M25.47|Effusion of joint, ankle and foot
M25.48|Effusion of joint, other sites
M25.49|Effusion of joint, unspecified site
M25.5|Pain in joint
M25.50|Pain in joint, multiple sites
M25.51|Pain in joint, shouder region
M25.52|Pain in joint, upper arm
M25.53|Pain in joint, forearm
M25.54|Pain in joint, hand
M25.55|Pain in joint, pelvic and thigh
M25.56|Pain in joint, lower leg
M25.57|Pain in joint, ankle and foot
M25.58|Pain in joint, other sites
M25.59|Pain in joint, unspecified site
M25.6|Stiffness of joint, not elsewhere classified
M25.60|Stiffness of joint, not elsewhere classified, multiple sites
M25.61|Stiffness of joint, not elsewhere classified, shoulder region
M25.62|Stiffness of joint, not elsewhere classified, upper arm
M25.63|Stiffness of joint, not elsewhere classified, forearm
M25.64|Stiffness of joint, not elsewhere classified, hand
M25.65|Stiffness of joint, not elsewhere classified, pelvic and thigh
M25.66|Stiffness of joint, not elsewhere classified, lower leg
M25.67|Stiffness of joint, not elsewhere classified, ankle and foot
M25.68|Stiffness of joint, not elsewhere classified, other sites
M25.69|Stiffness of joint, not elsewhere classified, unspecified site
M25.7|Osteophyte
M25.70|Osteophyte, multiple sites
M25.71|Osteophyte, shoulder region
M25.72|Osteophyte, upper arm
M25.73|Osteophyte, forearm
M25.74|Osteophyte, hand
M25.75|Osteophyte, pelvic and thigh
M25.76|Osteophyte, lower leg
M25.77|Osteophyte, ankle  and foot
M25.78|Osteophyte, other sites
M25.79|Osteophyte, unspecified site
M25.8|Other specified joint disorders
M25.80|Other specified joint disorders, multiple sites
M25.81|Other specified joint disorders, sholder region
M25.82|Other specified joint disorders, upper arm
M25.83|Other specified joint disorders, forearm
M25.84|Other specified joint disorders, hand
M25.85|Other specified joint disorders, pelvic and thigh
M25.86|Other specified joint disorders, lower leg
M25.87|Other specified joint disorders, ankle and foot
M25.88|Other specified joint disorders, other sites
M25.89|Other specified joint disorders, unspecified site
M25.9|Joint disorder, unspecified
M25.90|Joint disorder, unspecified, multiple sites
M25.91|Joint disorder, unspecified, shoulder region
M25.92|Joint disorder, unspecified, upper arm
M25.93|Joint disorder, unspecified, forearm
M25.94|Joint disorder, unspecified, hand
M25.95|Joint disorder, unspecified, pelvic and thigh
M25.96|Joint disorder, unspecified, lower leg
M25.97|Joint disorder, unspecified, ankle and foot
M25.98|Joint disorder, unspecified, other sites
M25.99|Joint disorder, unspecified, unspecified site
M30|Polyarteritis nodosa and related conditions
M30.0|Polyarteritis nodosa
M30.1|Polyarteritis with lung involvement [churg-strauss]
M30.2|Juvenile polyarteritis
M30.3|Mucocutaneous lymph node syndrome [kawasaki]
M30.8|Other conditions related to polyarteritis nodosa
M31|Other necrotizing vasculopathies
M31.0|Hypersensitivity angiitis
M31.1|Thrombotic microangiopathy
M31.2|Lethal midline granuloma
M31.3|Wegener's granulomatosis
M31.4|Aortic arch syndrome [takayasu]
M31.5|Giant cell arteritis with polymyalgia rheumatica
M31.6|Other giant cell arteritis
M31.7|Microscopic polyangiitis
M31.8|Other specified necrotizing vasculopathies
M31.9|Necrotizing vasculopathy, unspecified
M32|Systemic lupus erythematosus
M32.0|Drug-induced systemic lupus erythematosus
M32.1|Systemic lupus erythematosus with organ or system involvement
M32.8|Other forms of systemic lupus erythematosus
M32.9|Systemic lupus erythematosus, unspecified
M33|Dermatopolymyositis
M33.0|Juvenile dermatomyositis
M33.1|Other dermatomyositis
M33.2|Polymyositis
M33.9|Dermatopolymyositis, unspecified
M34|Systemic sclerosis
M34.0|Progressive systemic sclerosis
M34.1|CR(E)ST syndrome
M34.2|Systemic sclerosis induced by drugs and chemicals
M34.8|Other forms of systemic sclerosis
M34.9|Systemic sclerosis, unspecified
M35|Other systemic involvement of connective tissue
M35.0|Sicca syndrome [sjogren]
M35.1|Other overlap syndromes
M35.2|Behcet's disease
M35.3|Polymyalgia rheumatica
M35.4|Diffuse (eosinophilic) fasciitis
M35.5|Multifocal fibrosclerosis
M35.6|Relapsing panniculitis [Weber-Christian]
M35.7|Hypermobility syndrome
M35.8|Other specified systemic involvement of connective tissue
M35.9|Systemic involvement of connective tissue, unspecified
M36|Systemic disorders of connective tissue in diseases classified elsewhere
M36.0|Dermato(poly)myositis in neoplastic disease
M36.1|Arthropathy in neoplastic disease
M36.2|Haemophilic arthropathy
M36.3|Arthropathy in other blood disorders
M36.4|Arthropathy in hypersensitivity reactions classified elsewhere
M36.8|Systemic disorder of connective tissue in other diseases classified elsewhere
M40|Kyphosis and lordosis
M40.0|Postural kyphosis
M40.00|Postural kyphosis, multiple sites in spine
M40.01|Postural kyphosis, occipito-atlanto-axial region
M40.02|Postural kyphosis, cervical region
M40.03|Postural kyphosis, cervicothoracic region
M40.04|Postural kyphosis, thoracic region
M40.05|Postural kyphosis, thoracolumbar region
M40.06|Postural kyphosis, lumbar region
M40.07|Postural kyphosis, lumbosacral region
M40.08|Postural kyphosis, sacral and sacrococcygeal region
M40.09|Postural kyphosis, site unspecified
M40.1|Other secondary kyphosis
M40.10|Other secondary kyphosis, multiple sites in spine
M40.11|Other secondary kyphosis, occipito-atlanto-axial region
M40.12|Other secondary kyphosis, cervical region
M40.13|Other secondary kyphosis, cervicothoracic region
M40.14|Other secondary kyphosis, thoracic region
M40.15|Other secondary kyphosis, thoracolumbar region
M40.16|Other secondary kyphosis, lumbar region
M40.17|Other secondary kyphosis, lumbosacral region
M40.18|Other secondary kyphosis, sacral and sacrococcygeal region
M40.19|Other secondary kyphosis, site unspecified
M40.2|Other and unspecified kyphosis
M40.20|Other and unspecified kyphosis, multiple sites in spine
M40.21|Other and unspecified kyphosis, occipito-atlanto-axial region
M40.22|Other and unspecified kyphosis, cervical region
M40.23|Other and unspecified kyphosis, cervicothoracic region
M40.24|Other and unspecified kyphosis, thoracic region
M40.25|Other and unspecified kyphosis, thoracolumbar region
M40.26|Other and unspecified kyphosis, lumbar region
M40.27|Other and unspecified kyphosis, lumbosacral region
M40.28|Other and unspecified kyphosis, sacral and sacrococcygeal region
M40.29|Other and unspecified kyphosis, site unspecified
M40.3|Flatback syndrome
M40.30|Flatback syndrome, multiple sites in spine
M40.31|Flatback syndrome, occipito-atlanto-axial region
M40.32|Flatback syndrome, cervical region
M40.33|Flatback syndrome, cervicothoracic region
M40.34|Flatback syndrome, thoracic region
M40.35|Flatback syndrome, thoracolumbar region
M40.36|Flatback syndrome, lumbar region
M40.37|Flatback syndrome, lumbosacral region
M40.38|Flatback syndrome, sacral and sacrococcygeal region
M40.39|Flatback syndrome, site unspecified
M40.4|Other lordosis
M40.40|Other lordosis, multiple sites in spine
M40.41|Other lordosis, occipito-atlanto-axial region
M40.42|Other lordosis, cervical region
M40.43|Other lordosis, cervicothoracic region
M40.44|Other lordosis, thoracic region
M40.45|Other lordosis, thoracolumbar region
M40.46|Other lordosis, lumbar region
M40.47|Other lordosis, lumbosacral region
M40.48|Other lordosis, sacral and sacrococcygeal region
M40.49|Other lordosis, site unspecified
M40.5|Lordosis, unspecified
M40.50|Lordosis unspecified, multiple sites in spine
M40.51|Lordosis, unspecified, occipito-atlanto-axial region
M40.52|Lordosis, unspecified, cervical region
M40.53|Lordosis, unspecified, cervicothoracic region
M40.54|Lordosis, unspecified, thoracic region
M40.55|Lordosis, unspecified, thoracolumbar region
M40.56|Lordosis, unspecified, lumbar region
M40.57|Lordosis, unspecified, lumbosacral region
M40.58|Lordosis, unspecified, sacral and sacrococcygeal region
M40.59|Lordosis, unspecified, site unspecified
M41|Scoliosis
M41.0|Infantile idiopathic scoliosis
M41.00|Infantile idiopathic scoliosis, multiple sites in spine
M41.01|Infantile idiopathic scoliosis, occipito-atlanto-axial region
M41.02|Infantile idiopathic scoliosis , cervical region
M41.03|Infantile idiopathic scoliosis, cervicothoracic region
M41.04|Infantile idiopathic scoliosis, thoracic region
M41.05|Infantile idiopathic scoliosis, thoracolumbar region
M41.06|Infantile idiopathic scoliosis, lumbar region
M41.07|Infantile idiopathic scoliosis, lumbosacral region
M41.08|Infantile idiopathic scoliosis, sacral and sacrococcygeal region
M41.09|Infantile idiopathic scoliosis, site unspecified
M41.1|Juvenile idiopathic scoliosis
M41.10|Juvenile idiopathic scoliosis, multiple sites in spine
M41.11|Juvenile idiopathic scoliosis, occipito-atlanto-axial region
M41.12|Juvenile idiopathic scoliosis, cervical region
M41.13|Juvenile idiopathic scoliosis, cervicothoracic region
M41.14|Juvenile idiopathic scoliosis, thoracic region
M41.15|Juvenile idiopathic scoliosis, thoracolumbar region
M41.16|Juvenile idiopathic scoliosis, lumbar region
M41.17|Juvenile idiopathic scoliosis, lumbosacral region
M41.18|Juvenile idiopathic scoliosis, sacral and sacrococcygeal region
M41.19|Juvenile idiopathic scoliosis, site unspecified
M41.2|Other idiopathic scoliosis
M41.20|Other idiopathic scoliosis, multiple sites in spine
M41.21|Other idiopathic scoliosis, occipito-atlanto-axial region
M41.22|Other idiopathic scoliosis, cervical region
M41.23|Other idiopathic scoliosis, cervicothoracic region
M41.24|Other idiopathic scoliosis, thoracic region
M41.25|Other idiopathic scoliosis, thoracolumbar region
M41.26|Other idiopathic scoliosis, lumbar region
M41.27|Other idiopathic scoliosis, lumbosacral region
M41.28|Other idiopathic scoliosis, sacral and sacrococcygeal region
M41.29|Other idiopathic scoliosis, site unspecified
M41.3|Thoracogenic scoliosis
M41.30|Thoracogenic scoliosis, multiple sites in spine
M41.31|Thoracogenic scoliosis, occipito-atlanto-axial region
M41.32|Thoracogenic scoliosis, cervical region
M41.33|Thoracogenic scoliosis, cervicothoracic region
M41.34|Thoracogenic scoliosis, thoracic region
M41.35|Thoracogenic scoliosis, thoracolumbar region
M41.36|Thoracogenic scoliosis, lumbar region
M41.37|Thoracogenic scoliosis, lumbosacral region
M41.38|Thoracogenic scoliosis, sacral and sacrococcygeal region
M41.39|Thoracogenic scoliosis, site unspecified
M41.4|Neuromuscular scoliosis
M41.40|Neuromuscular scoliosis, multiple sites in spine
M41.41|Neuromuscular scoliosis, occipito-atlanto-axial region
M41.42|Neuromuscular scoliosis, cervical region
M41.43|Neuromuscular scoliosis, cervicothoracic region
M41.44|Neuromuscular scoliosis, thoracic region
M41.45|Neuromuscular scoliosis, thoracolumbar region
M41.46|Neuromuscular scoliosis, lumbar region
M41.47|Neuromuscular scoliosis, lumbosacral region
M41.48|Neuromuscular scoliosis, sacral and sacrococcygeal region
M41.49|Neuromuscular scoliosis, site unspecified
M41.5|Other secondary scoliosis
M41.50|Other secondary scoliosis, multiple sites in spine
M41.51|Other secondary scoliosis, occipito-atlanto-axial region
M41.52|Other secondary scoliosis, cervical region
M41.53|Other secondary scoliosis, cervicothoracic region
M41.54|Other secondary scoliosis, thoracic region
M41.55|Other secondary scoliosis, thoracolumbar region
M41.56|Other secondary scoliosis, lumbar region
M41.57|Other secondary scoliosis, lumbosacral region
M41.58|Other secondary scoliosis, sacral and sacrococcygeal region
M41.59|Other secondary scoliosis, site unspecified
M41.8|Other forms of scoliosis
M41.80|Other forms of scoliosis, multiple sites in spine
M41.81|Other forms of scoliosis, occipito-atlanto-axial region
M41.82|Other forms of scoliosis, cervical region
M41.83|Other forms of scoliosis, cervicothoracic region
M41.84|Other forms of scoliosis, thoracic region
M41.85|Other forms of scoliosis, thoracolumbar region
M41.86|Other forms of scoliosis, lumbar region
M41.87|Other forms of scoliosis, lumbosacral region
M41.88|Other forms of scoliosis, sacral and sacrococcygeal region
M41.89|Other forms of scoliosis, site unspecified
M41.9|Scoliosis, unspecified
M41.90|Scoliosis, multiple sites in spine
M41.91|Scoliosis, unspecified, occipito-atlanto-axial region
M41.92|Scoliosis, unspecified, cervical region
M41.93|Scoliosis, unspecified, cervicothoracic region
M41.94|Scoliosis, unspecified, thoracic region
M41.95|Scoliosis, unspecified, thoracolumbar region
M41.96|Scoliosis, unspecified, lumbar region
M41.97|Scoliosis, unspecified, lumbosacral region
M41.98|Scoliosis, unspecified, sacral and sacrococcygeal region
M41.99|Scoliosis, unspecified, site unspecified
M42|Spinal osteochondrosis
M42.0|Juvenile osteochondrosis of spine
M42.00|Juvenile osteochondrosis of spine, multiple sites in spine
M42.01|Juvenile osteochondrosis of spine, occipito-atlanto-axial region
M42.02|Juvenile osteochondrosis of spine, cervical region
M42.03|Juvenile osteochondrosis of spine, cervicothoracic region
M42.04|Juvenile osteochondrosis of spine, thoracic region
M42.05|Juvenile osteochondrosis of spine, thoracolumbar region
M42.06|Juvenile osteochondrosis of spine, lumbar region
M42.07|Juvenile osteochondrosis of spine, lumbosacral region
M42.08|Juvenile osteochondrosis of spine, sacral and sacrococcygeal region
M42.09|Juvenile osteochondrosis of spine, site unspecified
M42.1|Adult osteochondrosis of spine
M42.10|Adult osteochondrosis of spine, multiple sites in spine
M42.11|Adult osteochondrosis of spine, occipito-atlanto-axial region
M42.12|Adult osteochondrosis of spine, cervical region
M42.13|Adult osteochondrosis of spine, cervicothoracic region
M42.14|Adult osteochondrosis of spine, thoracic region
M42.15|Adult osteochondrosis of spine, thoracolumbar region
M42.16|Adult osteochondrosis of spine, lumbar region
M42.17|Adult osteochondrosis of spine, lumbosacral region
M42.18|Adult osteochondrosis of spine, sacral and sacrococcygeal region
M42.19|Adult osteochondrosis of spine, site unspecified
M42.9|Spinal osteochondrosis, unspecified
M42.90|Spinal osteochondrosis, unspecified, multiple sites in spine
M42.91|Spinal osteochondrosis, unspecified, occipito-atlanto-axial region
M42.92|Spinal osteochondrosis, unspecified, cervical region
M42.93|Spinal osteochondrosis, unspecified, cervicothoracic region
M42.94|Spinal osteochondrosis, unspecified, thoracic region
M42.95|Spinal osteochondrosis, unspecified, thoracolumbar region
M42.96|Spinal osteochondrosis, unspecified, lumbar region
M42.97|Spinal osteochondrosis, unspecified, lumbosacral region
M42.98|Spinal osteochondrosis, unspecified, sacral and sacrococcygeal region
M42.99|Spinal osteochondrosis, unspecified, site unspecified
M43|Other deforming dorsopathies
M43.0|Spondylolysis
M43.00|Spondylolysis, multiple sites in spine
M43.01|Spondylolysis, occipito-atlanto-axial region
M43.02|Spondylolysis, cervical region
M43.03|Spondylolysis, cervicothoracic region
M43.04|Spondylolysis, thoracic region
M43.05|Spondylolysis, thoracolumbar region
M43.06|Spondylolysis, lumbar region
M43.07|Spondylolysis, lumbosacral region
M43.08|Spondylolysis, sacral and sacrococcygeal region
M43.09|Spondylolysis, site unspecified
M43.1|Spondylolisthesis
M43.10|Spondylolisthesis, multiple sites in spine
M43.11|Spondylolisthesis, occipito-atlanto-axial region
M43.12|Spondylolisthesis, cervical region
M43.13|Spondylolisthesis, cervicothoracic region
M43.14|Spondylolisthesis, thoracic region
M43.15|Spondylolisthesis, thoracolumbar region
M43.16|Spondylolisthesis, lumbar region
M43.17|Spondylolisthesis, lumbosacral region
M43.18|Spondylolisthesis, sacral and sacrococcygeal region
M43.19|Spondylolisthesis, site unspecified
M43.2|Other fusion of spine
M43.20|Other fusion of spine, multiple sites in spine
M43.21|Other fusion of spine, occipito-atlanto-axial region
M43.22|Other fusion of spine, cervical region
M43.23|Other fusion of spine, cervicothoracic region
M43.24|Other fusion of spine, thoracic region
M43.25|Other fusion of spine, thoracolumbar region
M43.26|Other fusion of spine, lumbar region
M43.27|Other fusion of spine, lumbosacral region
M43.28|Other fusion of spine, sacral and sacrococcygeal region
M43.29|Other fusion of spine, site unspecified
M43.3|Recurrent atlantoaxial subluxation with myelopathy
M43.30|Recurrent atlantoaxial subluxation with myelopathy, multiple sites in spine
M43.31|Recurrent atlantoaxial subluxation with myelopathy, occipito-atlanto-axial region
M43.32|Recurrent atlantoaxial subluxation with myelopathy, cervical region
M43.33|Recurrent atlantoaxial subluxation with myelopathy, cervicothoracic region
M43.34|Recurrent atlantoaxial subluxation with myelopathy, thoracic region
M43.35|Recurrent atlantoaxial subluxation with myelopathy, thoracolumbar region
M43.36|Recurrent atlantoaxial subluxation with myelopathy, lumbar region
M43.37|Recurrent atlantoaxial subluxation with myelopathy, lumbosacral region
M43.38|Recurrent atlantoaxial subluxation with myelopathy, sacral and sacrococcygeal region
M43.39|Recurrent atlantoaxial subluxation with myelopathy, site unspecified
M43.4|Other recurrent atlantoaxial subluxation
M43.40|Other recurrent atlantoaxial subluxation, multiple sites in spine
M43.41|Other recurrent atlantoaxial subluxation, occipito-atlanto-axial region
M43.42|Other recurrent atlantoaxial subluxation, cervical region
M43.43|Other recurrent atlantoaxial subluxation, cervicothoracic region
M43.44|Other recurrent atlantoaxial subluxation, thoracic region
M43.45|Other recurrent atlantoaxial subluxation, thoracolumbar region
M43.46|Other recurrent atlantoaxial subluxation, lumbar region
M43.47|Other recurrent atlantoaxial subluxation, lumbosacral region
M43.48|Other recurrent atlantoaxial subluxation, sacral and sacrococcygeal region
M43.49|Other recurrent atlantoaxial subluxation, site unspecified
M43.5|Other recurrent vertebral subluxation
M43.50|Other recurrent vertebral subluxation, multiple sites in spine
M43.51|Other recurrent vertebral subluxation, occipito-atlanto-axial region
M43.52|Other recurrent vertebral subluxation, cervical region
M43.53|Other recurrent vertebral subluxation, cervicothoracic region
M43.54|Other recurrent vertebral subluxation, thoracic region
M43.55|Other recurrent vertebral subluxation, thoracolumar region
M43.56|Other recurrent vertebral subluxation, lumbar region
M43.57|Other recurrent vertebral subluxation, lumbosacral region
M43.58|Other recurrent vertebral subluxation, sacral and sacrococcygeal region
M43.59|Other recurrent vertebral subluxation, site unspecified
M43.6|Torticollis
M43.60|Torticollis, multiple sites in spine
M43.61|Torticollis, occipito-atlanto-axial region
M43.62|Torticollis, cervical region
M43.63|Torticollis, cervicothoracic region
M43.64|Torticollis, thoracic region
M43.65|Torticollis, thoracolumar region
M43.66|Torticollis, lumbar region
M43.67|Torticollis, lumbosacral region
M43.68|Torticollis, sacral and sacrococcygeal region
M43.69|Torticollis, site unspecified
M43.8|Other specified deforming dorsopathies
M43.80|Other specified deforming dorsopathies, multiple sites
M43.81|Other specified deforming dorsopathies, occipito and atlanto and axial region
M43.82|Other specified deforming dorsopathies, cervical region
M43.83|Other specified deforming dorsopathies, cervicothoracic region
M43.84|Other specified deforming dorsopathies, thoracic region
M43.85|Other specified deforming dorsopathies, thoracolumbar region
M43.86|Other specified deforming dorsopathies, lumbar region
M43.87|Other specified deforming dorsopathies, lumbosacral region
M43.88|Other specified deforming dorsopathies, sacral and sacrococcygeal region
M43.89|Other specified deforming dorsopathies, site unspecified
M43.9|Deforming dorsopathy, unspecified
M43.90|Deforming dorsopathy, unspecified, multiple sites
M43.91|Deforming dorsopathy, unspecified, occipito-atlanto-axial region
M43.92|Deforming dorsopathy, unspecified, cervical region
M43.93|Deforming dorsopathy, unspecified, cervicothoracic region
M43.94|Deforming dorsopathy, unspecified, thoracic region
M43.95|Deforming dorsopathy, unspecified, thoracolumbar region
M43.96|Deforming dorsopathy, unspecified, lumbar region
M43.97|Deforming dorsopathy, unspecified, lumbosacral region
M43.98|Deforming dorsopathy, unspecified, sacral and sacrococcygeal region
M43.99|Deforming dorsopathy, unspecified, site unspecified
M45|Ankylosing spondylitis
M45.0|Ankylosing spondylitis, multiple sites in spine
M45.1|Ankylosing spondylitis, occipito-atlanto-axial region
M45.2|Ankylosing spondylitis, cervical region
M45.3|Ankylosing spondylitis, cervicothoracic region
M45.4|Ankylosing spondylitis, thoracic region
M45.5|Ankylosing spondylitis, thoracolumbar region
M45.6|Ankylosing spondylitis, lumbar region
M45.7|Ankylosing spondylitis, lumbosacral region
M45.8|Ankylosing spondylitis, sacral and sacrococcygeal region
M45.9|Ankylosing spondylitis, site unspecified
M46|Spinal enthesopathy
M46.0|Spinal enthesopathy
M46.00|Spinal enthesopathy, multiple sites
M46.01|Spinal enthesopathy, occipito-atlanto-axial region
M46.02|Spinal enthesopathy, cervical region
M46.03|Spinal enthesopathy, cervicothoracic region
M46.04|Spinal enthesopathy, thoracic region
M46.05|Spinal enthesopathy, thoracolumbar region
M46.06|Spinal enthesopathy, lumbar region
M46.07|Spinal enthesopathy, lumbosacral region
M46.08|Spinal enthesopathy, sacral and sacrococcygeal region
M46.09|Spinal enthesopathy, site unspecified
M46.1|Sacroiliitis, not elsewhere classified
M46.10|Sacroiliitis, not elsewhere classified, multiple sites
M46.11|Sacroiliitis, not elsewhere classified, occipito-atlanto-axial region
M46.12|Sacroiliitis, not elsewhere classified, cervical region
M46.13|Sacroiliitis, not elsewhere classified, cervicothoracic region
M46.14|Sacroiliitis, not elsewhere classified, thoracic region
M46.15|Sacroiliitis, not elsewhere classified, thoracolumbar region
M46.16|Sacroiliitis, not elsewhere classified, lumbar region
M46.17|Sacroiliitis, not elsewhere classified, lumbosacral region
M46.18|Sacroiliitis, not elsewhere classified, sacral and sacrococcygeal region
M46.19|Sacroiliitis, not elsewhere classified, site unspecified
M46.2|Osteomyelitis of vertebra
M46.20|Osteomyelitis of vertebra, multiple sites
M46.21|Osteomyelitis of vertebra, occipito-atlanto-axial region
M46.22|Osteomyelitis of vertebra, cervical region
M46.23|Osteomyelitis of vertebra, cervicothoracic region
M46.24|Osteomyelitis of vertebra, thoracic region
M46.25|Osteomyelitis of vertebra, thoracolumbar region
M46.26|Osteomyelitis of vertebra, lumbar region
M46.27|Osteomyelitis of vertebra, lumbosacral region
M46.28|Osteomyelitis of vertebra, sacral and sacrococcygeal region
M46.29|Osteomyelitis of vertebra, site unspecified
M46.3|Infection of intervertebral disc (pyogenic)
M46.30|Infection of intervertebral disc (pyogenic), multiple sites
M46.31|Infection of intervertebral disc (pyogenic), occipito-atlanto-axial region
M46.32|Infection of intervertebral disc (pyogenic), cervical region
M46.33|Infection of intervertebral disc (pyogenic), cervicothoracic region
M46.34|Infection of intervertebral disc (pyogenic), thoracic region
M46.35|Infection of intervertebral disc (pyogenic), thoracolumbar region
M46.36|Infection of intervertebral disc (pyogenic), lumbar region
M46.37|Infection of intervertebral disc (pyogenic), lumbosacral region
M46.38|Infection of intervertebral disc (pyogenic), sacral and sacrococcygeal region
M46.39|Infection of intervertebral disc (pyogenic), site unspecified
M46.4|Discitis, unspecified
M46.40|Discitis, unspecified, multiple sites
M46.41|Discitis, unspecified, occipito-atlanto-axial region
M46.42|Discitis, unspecified, cervical region
M46.43|Discitis, unspecified, cervicothoracic region
M46.44|Discitis, unspecified, thoracic region
M46.45|Discitis, unspecified, thoracolumbar region
M46.46|Discitis, unspecified, lumbar region
M46.47|Discitis, unspecified, lumbosacral region
M46.48|Discitis, unspecified, sacral and sacrococcygeal region
M46.49|Discitis, unspecified, site unspecified
M46.5|Other infective spondylopathies
M46.50|Other infective spondylopathies, multiple sites
M46.51|Other infective spondylopathies, occipito-atlanto-axial region
M46.52|Other infective spondylopathies, cervical region
M46.53|Other infective spondylopathies, cervicothoracic region
M46.54|Other infective spondylopathies, thoracic region
M46.55|Other infective spondylopathies, thoracolumbar region
M46.56|Other infective spondylopathies, lumbar region
M46.57|Other infective spondylopathies, lumbosacral region
M46.58|Other infective spondylopathies, sacral and sacrococcygeal region
M46.59|Other infective spondylopathies, site unspecified
M46.8|Other specified inflammatory spondylopathies
M46.80|Other specified inflammatory spondylopathies, multiple sites
M46.81|Other specified inflammatory spondylopathies, occipito-atlanto-axial region
M46.82|Other specified inflammatory spondylopathies, cervical region
M46.83|Other specified inflammatory spondylopathies, cervicothoracic region
M46.84|Other specified inflammatory spondylopathies, thoracic region
M46.85|Other specified inflammatory spondylopathies, thoracolumbar region
M46.86|Other specified inflammatory spondylopathies, lumbar region
M46.87|Other specified inflammatory spondylopathies, lumbosacral region
M46.88|Other specified inflammatory spondylopathies, sacral and sacrococcygeal region
M46.89|Other specified inflammatory spondylopathies, site unspecified
M46.9|Inflammatory spondylopathy, unspecified
M46.90|Inflammatory spondylopathy, unspecified, multiple sites
M46.91|Inflammatory spondylopathy, unspecified, occipito-atlanto-axial region
M46.92|Inflammatory spondylopathy, unspecified, cervical region
M46.93|Inflammatory spondylopathy, unspecified, cervicothoracic region
M46.94|Inflammatory spondylopathy, unspecified, thoracic region
M46.95|Inflammatory spondylopathy, unspecified, thoracolumbar region
M46.96|Inflammatory spondylopathy, unspecified, lumbar region
M46.97|Inflammatory spondylopathy, unspecified, lumbosacral region
M46.98|Inflammatory spondylopathy, unspecified, sacral and sacrococcygeal region
M46.99|Inflammatory spondylopathy, unspecified, site unspecified
M47|Spondylosis
M47.0|Ant spinal and vertebral artery compression syndromes, multiple sites
M47.1|Ant spinal and vertebral artery compression syndromes, occipito-atlanto-axial region
M47.10|Other spondylosis with myelopathy, multiple sites
M47.11|Other spondylosis with myelopathy, occipito-atlanto-axial region
M47.12|Other spondylosis with myelopathy, cervical region
M47.13|Other spondylosis with myelopathy, cervicothoracic region
M47.14|Other spondylosis with myelopathy, thoracic region
M47.15|Other spondylosis with myelopathy, thoracolumbar region
M47.16|Other spondylosis with myelopathy, lumbar region
M47.17|Other spondylosis with myelopathy, lumbosacral region
M47.18|Other spondylosis with myelopathy, sacral and sacrococcygeal region
M47.19|Other spondylosis with myelopathy, site unspecified
M47.2|Other spondylosis with radiculopathy
M47.20|Other spondylosis with radiculopathy, multiple sites
M47.21|Other spondylosis with radiculopathy, occipito-atlanto-axial region
M47.22|Other spondylosis with radiculopathy, cervical region
M47.23|Other spondylosis with radiculopathy, cervicothoracic region
M47.24|Other spondylosis with radiculopathy, thoracic region
M47.25|Other spondylosis with radiculopathy, thoracolumbar region
M47.26|Other spondylosis with radiculopathy, lumbar region
M47.27|Other spondylosis with radiculopathy, lumbosacral region
M47.28|Other spondylosis with radiculopathy, sacral and sacrococcygeal region
M47.29|Other spondylosis with radiculopathy, site unspecified
M47.3|Ant spinal and vertebral artery compression syndromes, cervicothoracic region
M47.4|Ant spinal and vertebral artery compression syndromes, thoracic region
M47.5|Ant spinal and vertebral artery compression syndromes, thoracolumbar region
M47.6|Ant spinal and vertebral artery compression syndromes, lumbar region
M47.7|Ant spinal and vertebral artery compression syndromes, lumbosacral region
M47.8|Ant spinal and vertebral artery compression syndromes, sacral and sacrococcygeal region
M47.80|Other spondylosis, multiple sites
M47.81|Other spondylosis, occipito-atlanto-axial region
M47.82|Other spondylosis, cervical region
M47.83|Other spondylosis, cervicothoracic region
M47.84|Other spondylosis, thoracic region
M47.85|Other spondylosis, thoracolumbar region
M47.86|Other spondylosis, lumbar region
M47.87|Other spondylosis, lumbosacral region
M47.88|Other spondylosis, sacral and sacrococcygeal region
M47.89|Other spondylosis, site unspecified
M47.9|Ant spinal and vertebral artery compression syndromes, site unspecified
M47.90|Spondylosis, unspecified, multiple sites
M47.91|Spondylosis, unspecified, occipito-atlanto-axial region
M47.92|Spondylosis, unspecified, cervical region
M47.93|Spondylosis, unspecified, cervicothoracic region
M47.94|Spondylosis, unspecified, thoracic region
M47.95|Spondylosis, unspecified, thoracolumbar region
M47.96|Spondylosis, unspecified, lumbar region
M47.97|Spondylosis, unspecified, lumbosacral region
M47.98|Spondylosis, unspecified, sacral and sacrococcygeal region
M47.99|Spondylosis, unspecified, site unspecified
M48|Other spondylopathies
M48.0|Spinal stenosis
M48.00|Spinal stenosis, multiple sites
M48.01|Spinal stenosis, occipito-atlanto-axial region
M48.02|Spinal stenosis, cervical region
M48.03|Spinal stenosis, cervicothoracic region
M48.04|Spinal stenosis, thoracic region
M48.05|Spinal stenosis, thoracolumbar region
M48.06|Spinal stenosis, lumbar region
M48.07|Spinal stenosis, lumbosacral region
M48.08|Spinal stenosis, sacral and sacrococcygeal region
M48.09|Spinal stenosis, site unspecified
M48.1|Ankylosing hyperostosis [forestier]
M48.10|Ankylosing hyperostosis [forestier], multiple sites
M48.11|Ankylosing hyperostosis [forestier], occipito-atlanto-axial region
M48.12|Ankylosing hyperostosis [forestier], cervical region
M48.13|Ankylosing hyperostosis [forestier], cervicothoracic region
M48.14|Ankylosing hyperostosis [forestier], thoracic region
M48.15|Ankylosing hyperostosis [forestier], thoracolumbar region
M48.16|Ankylosing hyperostosis [forestier], lumbar region
M48.17|Ankylosing hyperostosis [forestier], lumbosacral region
M48.18|Ankylosing hyperostosis [forestier], sacral and sacrococcygeal region
M48.19|Ankylosing hyperostosis [forestier], site unspecified
M48.2|Kissing spine
M48.20|Kissing spine, multiple sites
M48.21|Kissing spine, occipito-atlanto-axial region
M48.22|Kissing spine, cervical region
M48.23|Kissing spine, cervicothoracic region
M48.24|Kissing spine, thoracic region
M48.25|Kissing spine, thoracolumbar region
M48.26|Kissing spine, lumbar region
M48.27|Kissing spine, lumbosacral region
M48.28|Kissing spine, sacral and sacrococcygeal region
M48.29|Kissing spine, site unspecified
M48.3|Traumatic spondylopathy
M48.30|Traumatic spondylopathy, multiple sites
M48.31|Traumatic spondylopathy, occipito-atlanto-axial region
M48.32|Traumatic spondylopathy, cervical region
M48.33|Traumatic spondylopathy, cervicothoracic region
M48.34|Traumatic spondylopathy, thoracic region
M48.35|Traumatic spondylopathy, thoracolumbar region
M48.36|Traumatic spondylopathy, lumbar region
M48.37|Traumatic spondylopathy, lumbosacral region
M48.38|Traumatic spondylopathy, sacral and sacrococcygeal region
M48.39|Traumatic spondylopathy, site unspecified
M48.4|Fatigue fracture of vertebra
M48.40|Fatigue fracture of vertebra, multiple sites
M48.41|Fatigue fracture of vertebra, occipito-atlanto-axial region
M48.42|Fatigue fracture of vertebra, cervical region
M48.43|Fatigue fracture of vertebra, cervicothoracic region
M48.44|Fatigue fracture of vertebra, thoracic region
M48.45|Fatigue fracture of vertebra, thoracolumbar region
M48.46|Fatigue fracture of vertebra, lumbar region
M48.47|Fatigue fracture of vertebra, lumbosacral region
M48.48|Fatigue fracture of vertebra, sacral and sacrococcygeal region
M48.49|Fatigue fracture of vertebra, site unspecified
M48.5|Collapsed vertebra, not elsewhere classified
M48.50|Collapsed vertebra, not elsewhere classified, multiple sites
M48.51|Collapsed vertebra, not elsewhere classified, occipito-atlanto-axial region
M48.52|Collapsed vertebra, not elsewhere classified, cervical region
M48.53|Collapsed vertebra, not elsewhere classified, cervicothoracic region
M48.54|Collapsed vertebra, not elsewhere classified, thoracic region
M48.55|Collapsed vertebra, not elsewhere classified, thoracolumbar region
M48.56|Collapsed vertebra, not elsewhere classified, lumbar region
M48.57|Collapsed vertebra, not elsewhere classified, lumbosacral region
M48.58|Collapsed vertebra, not elsewhere classified, sacral and sacrococcygeal region
M48.59|Collapsed vertebra, not elsewhere classified, site unspecified
M48.8|Other specified spondylopathies
M48.80|Other specified spondylopathies, multiple sites
M48.81|Other specified spondylopathies, occipito-atlanto-axial region
M48.82|Other specified spondylopathies, cervical region
M48.83|Other specified spondylopathies, cervicothoracic region
M48.84|Other specified spondylopathies, thoracic region
M48.85|Other specified spondylopathies, thoracolumbar region
M48.86|Other specified spondylopathies, lumbar region
M48.87|Other specified spondylopathies, lumbosacral region
M48.88|Other specified spondylopathies, sacral and sacrococcygeal region
M48.89|Other specified spondylopathies, site unspecified
M48.9|Spondylopathy, unspecified
M48.90|Spondylopathy, unspecified, multiple sites
M48.91|Spondylopathy, unspecified, occipito-atlanto-axial region
M48.92|Spondylopathy, unspecified, cervical region
M48.93|Spondylopathy, unspecified, cervicothoracic region
M48.94|Spondylopathy, unspecified, thoracic region
M48.95|Spondylopathy, unspecified, thoracolumbar region
M48.96|Spondylopathy, unspecified, lumbar region
M48.97|Spondylopathy, unspecified, lumbosacral region
M48.98|Spondylopathy, unspecified, sacral and sacrococcygeal region
M48.99|Spondylopathy, unspecified, site unspecified
M49|Spondylopathies in diseases classified elsewhere
M49.0|Tuberculosis of spine
M49.00|Tuberculosis of spine, multiple sites
M49.01|Tuberculosis of spine, occipito-atlanto-axial region
M49.02|Tuberculosis of spine, cervical region
M49.03|Tuberculosis of spine, cervicothoracic region
M49.04|Tuberculosis of spine, thoracic region
M49.05|Tuberculosis of spine, thoracolumbar region
M49.06|Tuberculosis of spine, lumbar region
M49.07|Tuberculosis of spine, lumbosacral region
M49.08|Tuberculosis of spine, sacral and sacrococcygeal region
M49.09|Tuberculosis of spine, site unspecified
M49.1|Brucella spondylitis
M49.10|Brucella spondylitis, multiple sites
M49.11|Brucella spondylitis, occipito-atlanto-axial region
M49.12|Brucella spondylitis, cervical region
M49.13|Brucella spondylitis, cervicothoracic region
M49.14|Brucella spondylitis, thoracic region
M49.15|Brucella spondylitis, thoracolumbar region
M49.16|Brucella spondylitis, lumbar region
M49.17|Brucella spondylitis, lumbosacral region
M49.18|Brucella spondylitis, sacral and sacrococcygeal region
M49.19|Brucella spondylitis, site unspecified
M49.2|Enterobacterial spondylitis
M49.20|Enterobacterial spondylitis, multiple sites
M49.21|Enterobacterial spondylitis, occipito-atlanto-axial region
M49.22|Enterobacterial spondylitis, cervical region
M49.23|Enterobacterial spondylitis, cervicothoracic region
M49.24|Enterobacterial spondylitis, thoracic region
M49.25|Enterobacterial spondylitis, thoracolumbar region
M49.26|Enterobacterial spondylitis, lumbar region
M49.27|Enterobacterial spondylitis, lumbosacral region
M49.28|Enterobacterial spondylitis, sacral and sacrococcygeal region
M49.29|Enterobacterial spondylitis, site unspecified
M49.3|Spondylopathy in other infectious and parasitic disease classified elsewhere
M49.30|Spondylopathy in other infectious and parasitic disease, multiple sites
M49.31|Spondylopathy in other infectious and parasitic disease, occipito-atlanto-axial region
M49.32|Spondylopathy in other infectious and parasitic disease, cervical region
M49.33|Spondylopathy in other infectious and parasitic disease, cervicothoracic region
M49.34|Spondylopathy in other infectious and parasitic disease, thoracic region
M49.35|Spondylopathy in other infectious and parasitic disease, thoracolumbar region
M49.36|Spondylopathy in other infectious and parasitic disease, lumbar region
M49.37|Spondylopathy in other infectious and parasitic disease, lumbosacral region
M49.38|Spondylopathy in other infectious and parasitic disease, sacral and sacrococcygeal region
M49.39|Spondylopathy in other infectious and parasitic disease, site unspecified
M49.4|Neuropathic spondylopathy
M49.40|Neuropathic spondylopathy, multiple sites
M49.41|Neuropathic spondylopathy, occipito-atlanto-axial region
M49.42|Neuropathic spondylopathy, cervical region
M49.43|Neuropathic spondylopathy, cervicothoracic region
M49.44|Neuropathic spondylopathy, thoracic region
M49.45|Neuropathic spondylopathy, thoracolumbar region
M49.46|Neuropathic spondylopathy, lumbar region
M49.47|Neuropathic spondylopathy, lumbosacral region
M49.48|Neuropathic spondylopathy, sacral and sacrococcygeal region
M49.49|Neuropathic spondylopathy, site unspecified
M49.5|Collapsed vertebra in diseases classified elsewhere
M49.50|Collapsed vertebra in diseases classified elsewhere, multiple sites
M49.51|Collapsed vertebra in diseases classified elsewhere, occipito-atlanto-axial region
M49.52|Collapsed vertebra in diseases classified elsewhere, cervical region
M49.53|Collapsed vertebra in diseases classified elsewhere, cervicothoracic region
M49.54|Collapsed vertebra in diseases classified elsewhere, thoracic region
M49.55|Collapsed vertebra in diseases classified elsewhere, thoracolumbar region
M49.56|Collapsed vertebra in diseases classified elsewhere, lumbar region
M49.57|Collapsed vertebra in diseases classified elsewhere, lumbosacral region
M49.58|Collapsed vertebra in diseases classified elsewhere, sacral and sacrococcygeal region
M49.59|Collapsed vertebra in diseases classified elsewhere, site unspecified
M49.8|Spondylopathy in other diseases classified elsewhere
M49.80|Spondylopathy in other diseases classified elsewhere, multiple sites
M49.81|Spondylopathy in other diseases classified elsewhere, occipito-atlanto-axial region
M49.82|Spondylopathy in other diseases classified elsewhere, cervical region
M49.83|Spondylopathy in other diseases classified elsewhere, cervicothoracic region
M49.84|Spondylopathy in other diseases classified elsewhere, thoracic region
M49.85|Spondylopathy in other diseases classified elsewhere, thoracolumbar region
M49.86|Spondylopathy in other diseases classified elsewhere, lumbar region
M49.87|Spondylopathy in other diseases classified elsewhere, lumbosacral region
M49.88|Spondylopathy in other diseases classified elsewhere, sacral and sacrococcygeal region
M49.89|Spondylopathy in other diseases classified elsewhere, site unspecified
M50|Cervical disc disorders
M50.0|Cervical disc disorder with myelopathy
M50.1|Cervical disc disorder with radiculopathy
M50.2|Other cervical disc displacement
M50.3|Other cervical disc degeneration
M50.8|Other cervical disc disorders
M50.9|Cervical disc disorder, unspecified
M51|Other intervertebral disc disorders
M51.0|Lumbar and other intervertebral disc disorder with mylopathy
M51.1|Lumbar and other intervertebral disc disorders with radiculopathy
M51.2|Other specified intervertebral disc displacement
M51.3|Other specified intervertebral disc degeneration
M51.4|Schmorl's nodes
M51.8|Other specified intervertebral disc disorders$ICD$, E'\n')) as x
where x <> ''
on conflict (kode) do update set nama = excluded.nama;

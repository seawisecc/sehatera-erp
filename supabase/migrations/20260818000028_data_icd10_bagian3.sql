-- ============================================================
-- 0028  Isi ICD-10 bagian 3 dari 3 (V11.4 sampai U12.9)
-- ============================================================
--
-- 4385 kode, dari berkas e-klaim Kemenkes versi ICD10_2010.
--
-- Dipecah bertiga bukan karena rapi, tapi karena satu tempelan 1 MB membuat
-- SQL Editor Supabase tersendat, dan jalur menjalankan SQL di project ini
-- memang lewat sana. Potongannya rata menurut ukuran, bukan menurut bab:
-- bab ICD-10 timpang jauh (bab cedera sendiri hampir seperempat berkas),
-- jadi memotong di batas bab menghasilkan satu bagian yang tetap kebesaran.
-- Urutan kodenya tetap menaik, jadi bagian mana pun masih bisa ditelusuri.
--
-- Isinya dibungkus satu dollar-quote supaya seluruhnya jadi SATU pernyataan
-- dan satu string, bukan 4385 tuple VALUES yang harus diurai satu per satu.
-- Tidak ada tanda kutip yang perlu dilarikan, jadi nama seperti
-- "Crohn's disease" masuk apa adanya. Pemisahnya "|", dan sudah diperiksa:
-- tidak ada satu pun nama di kedua berkas Kemenkes yang memuat "|".
--
-- Bisa dijalankan ulang: `on conflict do update`, jadi menempelkannya dua
-- kali tidak menggandakan apa pun dan tidak mengeluh.

insert into public.icd10 (kode, nama)
select split_part(x, '|', 1), split_part(x, '|', 2)
from unnest(string_to_array($ICD$V11.4|Pedal cyclist injured in collision with other pedal cycle: Driver injured in traffic accident
V11.5|Pedal cyclist injured in collision with other pedal cycle: Passenger injured in traffic accident
V11.9|Pedal cyclist injured in collision with other pedal cycle: Unspecified pedal cyclist injured in traffic accident
V12|Pedal cyclist injured in collision with two- or three-wheeled motor vehicle
V12.0|Pedal cyclist injured in collision with two- or three-wheeled motor vehicle: Driver injured in nontraffic accident
V12.1|Pedal cyclist injured in collision with two- or three-wheeled motor vehicle: Passenger injured in nontraffic accident
V12.2|Pedal cyclist injured in collision with two- or three-wheeled motor vehicle: Unspecified pedal cyclist injured in nontraffic accident
V12.3|Pedal cyclist injured in collision with two- or three-wheeled motor vehicle: Person injured while boarding or alighting
V12.4|Pedal cyclist injured in collision with two- or three-wheeled motor vehicle: Driver injured in traffic accident
V12.5|Pedal cyclist injured in collision with two- or three-wheeled motor vehicle: Passenger injured in traffic accident
V12.9|Pedal cyclist injured in collision with two- or three-wheeled motor vehicle: Unspecified pedal cyclist injured in traffic accident
V13|Pedal cyclist injured in collision with car, pick-up truck or van
V13.0|Pedal cyclist injured in collision with car, pick-up truck or van: Driver injured in nontraffic accident
V13.1|Pedal cyclist injured in collision with car, pick-up truck or van: Passenger injured in nontraffic accident
V13.2|Pedal cyclist injured in collision with car, pick-up truck or van: Unspecified pedal cyclist injured in nontraffic accident
V13.3|Pedal cyclist injured in collision with car, pick-up truck or van: Person injured while boarding or alighting
V13.4|Pedal cyclist injured in collision with car, pick-up truck or van: Driver injured in traffic accident
V13.5|Pedal cyclist injured in collision with car, pick-up truck or van: Passenger injured in traffic accident
V13.9|Pedal cyclist injured in collision with car, pick-up truck or van: Unspecified pedal cyclist injured in traffic accident
V14|Pedal cyclist injured in collision with heavy transport vehicle or bus
V14.0|Pedal cyclist injured in collision with heavy transport vehicle or bus: Driver injured in nontraffic accident
V14.1|Pedal cyclist injured in collision with heavy transport vehicle or bus: Passenger injured in nontraffic accident
V14.2|Pedal cyclist injured in collision with heavy transport vehicle or bus: Unspecified pedal cyclist injured in nontraffic accident
V14.3|Pedal cyclist injured in collision with heavy transport vehicle or bus: Person injured while boarding or alighting
V14.4|Pedal cyclist injured in collision with heavy transport vehicle or bus: Driver injured in traffic accident
V14.5|Pedal cyclist injured in collision with heavy transport vehicle or bus: Passenger injured in traffic accident
V14.9|Pedal cyclist injured in collision with heavy transport vehicle or bus: Unspecified pedal cyclist injured in traffic accident
V15|Pedal cyclist injured in collision with railway train or railway vehicle
V15.0|Pedal cyclist injured in collision with railway train or railway vehicle: Driver injured in nontraffic accident
V15.1|Pedal cyclist injured in collision with railway train or railway vehicle: Passenger injured in nontraffic accident
V15.2|Pedal cyclist injured in collision with railway train or railway vehicle: Unspecified pedal cyclist injured in nontraffic accident
V15.3|Pedal cyclist injured in collision with railway train or railway vehicle: Person injured while boarding or alighting
V15.4|Pedal cyclist injured in collision with railway train or railway vehicle: Driver injured in traffic accident
V15.5|Pedal cyclist injured in collision with railway train or railway vehicle: Passenger injured in traffic accident
V15.9|Pedal cyclist injured in collision with railway train or railway vehicle: Unspecified pedal cyclist injured in traffic accident
V16|Pedal cyclist injured in collision with other nonmotor vehicle
V16.0|Pedal cyclist injured in collision with other nonmotor vehicle: Driver injured in nontraffic accident
V16.1|Pedal cyclist injured in collision with other nonmotor vehicle: Passenger injured in nontraffic accident
V16.2|Pedal cyclist injured in collision with other nonmotor vehicle: Unspecified pedal cyclist injured in nontraffic accident
V16.3|Pedal cyclist injured in collision with other nonmotor vehicle: Person injured while boarding or alighting
V16.4|Pedal cyclist injured in collision with other nonmotor vehicle: Driver injured in traffic accident
V16.5|Pedal cyclist injured in collision with other nonmotor vehicle: Passenger injured in traffic accident
V16.9|Pedal cyclist injured in collision with other nonmotor vehicle: Unspecified pedal cyclist injured in traffic accident
V17|Pedal cyclist injured in collision with fixed or stationary object
V17.0|Pedal cyclist injured in collision with fixed or stationary object: Driver injured in nontraffic accident
V17.1|Pedal cyclist injured in collision with fixed or stationary object: Passenger injured in nontraffic accident
V17.2|Pedal cyclist injured in collision with fixed or stationary object: Unspecified pedal cyclist injured in nontraffic accident
V17.3|Pedal cyclist injured in collision with fixed or stationary object: Person injured while boarding or alighting
V17.4|Pedal cyclist injured in collision with fixed or stationary object: Driver injured in traffic accident
V17.5|Pedal cyclist injured in collision with fixed or stationary object: Passenger injured in traffic accident
V17.9|Pedal cyclist injured in collision with fixed or stationary object: Unspecified pedal cyclist injured in traffic accident
V18|Pedal cyclist injured in noncollision transport accident
V18.0|Pedal cyclist injured in noncollision transport accident: Driver injured in nontraffic accident
V18.1|Pedal cyclist injured in noncollision transport accident: Passenger injured in nontraffic accident
V18.2|Pedal cyclist injured in noncollision transport accident: Unspecified pedal cyclist injured in nontraffic accident
V18.3|Pedal cyclist injured in noncollision transport accident: Person injured while boarding or alighting
V18.4|Pedal cyclist injured in noncollision transport accident: Driver injured in traffic accident
V18.5|Pedal cyclist injured in noncollision transport accident: Passenger injured in traffic accident
V18.9|Pedal cyclist injured in noncollision transport accident: Unspecified pedal cyclist injured in traffic accident
V19|Pedal cyclist injured in other and unspecified transport accidents
V19.0|Driver injured in collision with other and unspecified motor vehicles in nontraffic accident
V19.1|Passenger injured in collision with other and unspecified motor vehicles in nontraffic accident
V19.2|Unspecified pedal cyclist injured in collision with other and unspecified motor vehicles in nontraffic accident
V19.3|Pedal cyclist [any] injured in unspecified nontraffic accident
V19.4|Driver injured in collision with other and unspecified motor vehicles in traffic accident
V19.5|Passenger injured in collision with other and unspecified motor vehicles in traffic accident
V19.6|Unspecified pedal cyclist injured in collision with other and unspecified motor vehicles in traffic accident
V19.8|Pedal cyclist [any] injured in other specified transport accidents
V19.9|Pedal cyclist [any] injured in unspecified traffic accident
V20|Motorcycle rider injured in collision with pedestrian or animal
V20.0|Motorcycle rider injured in collision with pedestrian or animal: Driver injured in nontraffic accident
V20.1|Motorcycle rider injured in collision with pedestrian or animal: Passenger injured in nontraffic accident
V20.2|Motorcycle rider injured in collision with pedestrian or animal: Unspecified motorcycle rider injured in nontraffic accident
V20.3|Motorcycle rider injured in collision with pedestrian or animal: Person injured while boarding or alighting
V20.4|Motorcycle rider injured in collision with pedestrian or animal: Driver injured in traffic accident
V20.5|Motorcycle rider injured in collision with pedestrian or animal: Passenger injured in traffic accident
V20.9|Motorcycle rider injured in collision with pedestrian or animal: Unspecified motorcycle rider injured in traffic accident
V21|Motorcycle rider injured in collision with pedal cycle
V21.0|Motorcycle rider injured in collision with pedal cycle: Driver injured in nontraffic accident
V21.1|Motorcycle rider injured in collision with pedal cycle: Passenger injured in nontraffic accident
V21.2|Motorcycle rider injured in collision with pedal cycle: Unspecified motorcycle rider injured in nontraffic accident
V21.3|Motorcycle rider injured in collision with pedal cycle: Person injured while boarding or alighting
V21.4|Motorcycle rider injured in collision with pedal cycle: Driver injured in traffic accident
V21.5|Motorcycle rider injured in collision with pedal cycle: Passenger injured in traffic accident
V21.9|Motorcycle rider injured in collision with pedal cycle: Unspecified motorcycle rider injured in traffic accident
V22|Motorcycle rider injured in collision with two- or three-wheeled motor vehicle
V22.0|Motorcycle rider injured in collision with two- or three-wheeled motor vehicle: Driver injured in nontraffic accident
V22.1|Motorcycle rider injured in collision with two- or three-wheeled motor vehicle: Passenger injured in nontraffic accident
V22.2|Motorcycle rider injured in collision with two- or three-wheeled motor vehicle: Unspecified motorcycle rider injured in nontraffic accident
V22.3|Motorcycle rider injured in collision with two- or three-wheeled motor vehicle: Person injured while boarding or alighting
V22.4|Motorcycle rider injured in collision with two- or three-wheeled motor vehicle: Driver injured in traffic accident
V22.5|Motorcycle rider injured in collision with two- or three-wheeled motor vehicle: Passenger injured in traffic accident
V22.9|Motorcycle rider injured in collision with two- or three-wheeled motor vehicle: Unspecified motorcycle rider injured in traffic accident
V23|Motorcycle rider injured in collision with car, pick-up truck or van
V23.0|Motorcycle rider injured in collision with car, pick-up truck or van: Driver injured in nontraffic accident
V23.1|Motorcycle rider injured in collision with car, pick-up truck or van: Passenger injured in nontraffic accident
V23.2|Motorcycle rider injured in collision with car, pick-up truck or van: Unspecified motorcycle rider injured in nontraffic accident
V23.3|Motorcycle rider injured in collision with car, pick-up truck or van: Person injured while boarding or alighting
V23.4|Motorcycle rider injured in collision with car, pick-up truck or van: Driver injured in traffic accident
V23.5|Motorcycle rider injured in collision with car, pick-up truck or van: Passenger injured in traffic accident
V23.9|Motorcycle rider injured in collision with car, pick-up truck or van: Unspecified motorcycle rider injured in traffic accident
V24|Motorcycle rider injured in collision with heavy transport vehicle or bus
V24.0|Motorcycle rider injured in collision with heavy transport vehicle or bus: Driver injured in nontraffic accident
V24.1|Motorcycle rider injured in collision with heavy transport vehicle or bus: Passenger injured in nontraffic accident
V24.2|Motorcycle rider injured in collision with heavy transport vehicle or bus: Unspecified motorcycle rider injured in nontraffic accident
V24.3|Motorcycle rider injured in collision with heavy transport vehicle or bus: Person injured while boarding or alighting
V24.4|Motorcycle rider injured in collision with heavy transport vehicle or bus: Driver injured in traffic accident
V24.5|Motorcycle rider injured in collision with heavy transport vehicle or bus: Passenger injured in traffic accident
V24.9|Motorcycle rider injured in collision with heavy transport vehicle or bus: Unspecified motorcycle rider injured in traffic accident
V25|Motorcycle rider injured in collision with railway train or railway vehicle
V25.0|Motorcycle rider injured in collision with railway train or railway vehicle: Driver injured in nontraffic accident
V25.1|Motorcycle rider injured in collision with railway train or railway vehicle: Passenger injured in nontraffic accident
V25.2|Motorcycle rider injured in collision with railway train or railway vehicle: Unspecified motorcycle rider injured in nontraffic accident
V25.3|Motorcycle rider injured in collision with railway train or railway vehicle: Person injured while boarding or alighting
V25.4|Motorcycle rider injured in collision with railway train or railway vehicle: Driver injured in traffic accident
V25.5|Motorcycle rider injured in collision with railway train or railway vehicle: Passenger injured in traffic accident
V25.9|Motorcycle rider injured in collision with railway train or railway vehicle: Unspecified motorcycle rider injured in traffic accident
V26|Motorcycle rider injured in collision with other nonmotor vehicle
V26.0|Motorcycle rider injured in collision with other nonmotor vehicle: Driver injured in nontraffic accident
V26.1|Motorcycle rider injured in collision with other nonmotor vehicle: Passenger injured in nontraffic accident
V26.2|Motorcycle rider injured in collision with other nonmotor vehicle: Unspecified motorcycle rider injured in nontraffic accident
V26.3|Motorcycle rider injured in collision with other nonmotor vehicle: Person injured while boarding or alighting
V26.4|Motorcycle rider injured in collision with other nonmotor vehicle: Driver injured in traffic accident
V26.5|Motorcycle rider injured in collision with other nonmotor vehicle: Passenger injured in traffic accident
V26.9|Motorcycle rider injured in collision with other nonmotor vehicle: Unspecified motorcycle rider injured in traffic accident
V27|Motorcycle rider injured in collision with fixed or stationary object
V27.0|Motorcycle rider injured in collision with fixed or stationary object: Driver injured in nontraffic accident
V27.1|Motorcycle rider injured in collision with fixed or stationary object: Passenger injured in nontraffic accident
V27.2|Motorcycle rider injured in collision with fixed or stationary object: Unspecified motorcycle rider injured in nontraffic accident
V27.3|Motorcycle rider injured in collision with fixed or stationary object: Person injured while boarding or alighting
V27.4|Motorcycle rider injured in collision with fixed or stationary object: Driver injured in traffic accident
V27.5|Motorcycle rider injured in collision with fixed or stationary object: Passenger injured in traffic accident
V27.9|Motorcycle rider injured in collision with fixed or stationary object: Unspecified motorcycle rider injured in traffic accident
V28|Motorcycle rider injured in noncollision transport accident
V28.0|Motorcycle rider injured in noncollision transport accident: Driver injured in nontraffic accident
V28.1|Motorcycle rider injured in noncollision transport accident: Passenger injured in nontraffic accident
V28.2|Motorcycle rider injured in noncollision transport accident: Unspecified motorcycle rider injured in nontraffic accident
V28.3|Motorcycle rider injured in noncollision transport accident: Person injured while boarding or alighting
V28.4|Motorcycle rider injured in noncollision transport accident: Driver injured in traffic accident
V28.5|Motorcycle rider injured in noncollision transport accident: Passenger injured in traffic accident
V28.9|Motorcycle rider injured in noncollision transport accident: Unspecified motorcycle rider injured in traffic accident
V29|Motorcycle rider injured in other and unspecified transport accidents
V29.0|Driver injured in collision with other and unspecified motor vehicles in nontraffic accident
V29.1|Passenger injured in collision with other and unspecified motor vehicles in nontraffic accident
V29.2|Unspecified motorcycle rider injured in collision with other and unspecified motor vehicles in nontraffic accident
V29.3|Motorcycle rider [any] injured in unspecified nontraffic accident
V29.4|Driver injured in collision with other and unspecified motor vehicles in traffic accident
V29.5|Passenger injured in collision with other and unspecified motor vehicles in traffic accident
V29.6|Unspecified motorcycle rider injured in collision with other and unspecified motor vehicles in traffic accident
V29.8|Motorcycle rider [any] injured in other specified transport accidents
V29.9|Motorcycle rider [any] injured in unspecified traffic accident
V30|Occupant of three-wheeled motor vehicle injured in collision with pedestrian or animal
V30.0|Occupant of three-wheeled motor vehicle injured in collision with pedestrian or animal: Driver injured in nontraffic accident
V30.1|Occupant of three-wheeled motor vehicle injured in collision with pedestrian or animal: Passenger injured in nontraffic accident
V30.2|Occupant of three-wheeled motor vehicle injured in collision with pedestrian or animal: Person on outside of vehicle injured in nontraffic accident
V30.3|Occupant of three-wheeled motor vehicle injured in collision with pedestrian or animal: Unspecified occupant of three-wheeled motor vehicle injured in nontraffic accident
V30.4|Occupant of three-wheeled motor vehicle injured in collision with pedestrian or animal: Person injured while boarding or alighting
V30.5|Occupant of three-wheeled motor vehicle injured in collision with pedestrian or animal: Driver injured in traffic accident
V30.6|Occupant of three-wheeled motor vehicle injured in collision with pedestrian or animal: Passenger injured in traffic accident
V30.7|Occupant of three-wheeled motor vehicle injured in collision with pedestrian or animal: Person on outside of vehicle injured in traffic accident
V30.9|Occupant of three-wheeled motor vehicle injured in collision with pedestrian or animal: Unspecified occupant of three-wheeled motor vehicle injured in traffic accident
V31|Occupant of three-wheeled motor vehicle injured in collision with pedal cycle
V31.0|Occupant of three-wheeled motor vehicle injured in collision with pedal cycle: Driver injured in nontraffic accident
V31.1|Occupant of three-wheeled motor vehicle injured in collision with pedal cycle: Passenger injured in nontraffic accident
V31.2|Occupant of three-wheeled motor vehicle injured in collision with pedal cycle: Person on outside of vehicle injured in nontraffic accident
V31.3|Occupant of three-wheeled motor vehicle injured in collision with pedal cycle: Unspecified occupant of three-wheeled motor vehicle injured in nontraffic accident
V31.4|Occupant of three-wheeled motor vehicle injured in collision with pedal cycle: Person injured while boarding or alighting
V31.5|Occupant of three-wheeled motor vehicle injured in collision with pedal cycle: Driver injured in traffic accident
V31.6|Occupant of three-wheeled motor vehicle injured in collision with pedal cycle: Passenger injured in traffic accident
V31.7|Occupant of three-wheeled motor vehicle injured in collision with pedal cycle: Person on outside of vehicle injured in traffic accident
V31.9|Occupant of three-wheeled motor vehicle injured in collision with pedal cycle: Unspecified occupant of three-wheeled motor vehicle injured in traffic accident
V32|Occupant of three-wheeled motor vehicle injured in collision with two- or three-wheeled motor vehicle
V32.0|Occupant of three-wheeled motor vehicle injured in collision with two- or three-wheeled motor vehicle: Driver injured in nontraffic accident
V32.1|Occupant of three-wheeled motor vehicle injured in collision with two- or three-wheeled motor vehicle: Passenger injured in nontraffic accident
V32.2|Occupant of three-wheeled motor vehicle injured in collision with two- or three-wheeled motor vehicle: Person on outside of vehicle injured in nontraffic accident
V32.3|Occupant of three-wheeled motor vehicle injured in collision with two- or three-wheeled motor vehicle: Unspecified occupant of three-wheeled motor vehicle injured in nontraffic accident
V32.4|Occupant of three-wheeled motor vehicle injured in collision with two- or three-wheeled motor vehicle: Person injured while boarding or alighting
V32.5|Occupant of three-wheeled motor vehicle injured in collision with two- or three-wheeled motor vehicle: Driver injured in traffic accident
V32.6|Occupant of three-wheeled motor vehicle injured in collision with two- or three-wheeled motor vehicle: Passenger injured in traffic accident
V32.7|Occupant of three-wheeled motor vehicle injured in collision with two- or three-wheeled motor vehicle: Person on outside of vehicle injured in traffic accident
V32.9|Occupant of three-wheeled motor vehicle injured in collision with two- or three-wheeled motor vehicle: Unspecified occupant of three-wheeled motor vehicle injured in traffic accident
V33|Occupant of three-wheeled motor vehicle injured in collision with car, pick-up truck or van
V33.0|Occupant of three-wheeled motor vehicle injured in collision with car, pick-up truck or van: Driver injured in nontraffic accident
V33.1|Occupant of three-wheeled motor vehicle injured in collision with car, pick-up truck or van: Passenger injured in nontraffic accident
V33.2|Occupant of three-wheeled motor vehicle injured in collision with car, pick-up truck or van: Person on outside of vehicle injured in nontraffic accident
V33.3|Occupant of three-wheeled motor vehicle injured in collision with car, pick-up truck or van: Unspecified occupant of three-wheeled motor vehicle injured in nontraffic accident
V33.4|Occupant of three-wheeled motor vehicle injured in collision with car, pick-up truck or van: Person injured while boarding or alighting
V33.5|Occupant of three-wheeled motor vehicle injured in collision with car, pick-up truck or van: Driver injured in traffic accident
V33.6|Occupant of three-wheeled motor vehicle injured in collision with car, pick-up truck or van: Passenger injured in traffic accident
V33.7|Occupant of three-wheeled motor vehicle injured in collision with car, pick-up truck or van: Person on outside of vehicle injured in traffic accident
V33.9|Occupant of three-wheeled motor vehicle injured in collision with car, pick-up truck or van: Unspecified occupant of three-wheeled motor vehicle injured in traffic accident
V34|Occupant of three-wheeled motor vehicle injured in collision with heavy transport vehicle or bus
V34.0|Occupant of three-wheeled motor vehicle injured in collision with heavy transport vehicle or bus: Driver injured in nontraffic accident
V34.1|Occupant of three-wheeled motor vehicle injured in collision with heavy transport vehicle or bus: Passenger injured in nontraffic accident
V34.2|Occupant of three-wheeled motor vehicle injured in collision with heavy transport vehicle or bus: Person on outside of vehicle injured in nontraffic accident
V34.3|Occupant of three-wheeled motor vehicle injured in collision with heavy transport vehicle or bus: Unspecified occupant of three-wheeled motor vehicle injured in nontraffic accident
V34.4|Occupant of three-wheeled motor vehicle injured in collision with heavy transport vehicle or bus: Person injured while boarding or alighting
V34.5|Occupant of three-wheeled motor vehicle injured in collision with heavy transport vehicle or bus: Driver injured in traffic accident
V34.6|Occupant of three-wheeled motor vehicle injured in collision with heavy transport vehicle or bus: Passenger injured in traffic accident
V34.7|Occupant of three-wheeled motor vehicle injured in collision with heavy transport vehicle or bus: Person on outside of vehicle injured in traffic accident
V34.9|Occupant of three-wheeled motor vehicle injured in collision with heavy transport vehicle or bus: Unspecified occupant of three-wheeled motor vehicle injured in traffic accident
V35|Occupant of three-wheeled motor vehicle injured in collision with railway train or railway vehicle
V35.0|Occupant of three-wheeled motor vehicle injured in collision with railway train or railway vehicle: Driver injured in nontraffic accident
V35.1|Occupant of three-wheeled motor vehicle injured in collision with railway train or railway vehicle: Passenger injured in nontraffic accident
V35.2|Occupant of three-wheeled motor vehicle injured in collision with railway train or railway vehicle: Person on outside of vehicle injured in nontraffic accident
V35.3|Occupant of three-wheeled motor vehicle injured in collision with railway train or railway vehicle: Unspecified occupant of three-wheeled motor vehicle injured in nontraffic accident
V35.4|Occupant of three-wheeled motor vehicle injured in collision with railway train or railway vehicle: Person injured while boarding or alighting
V35.5|Occupant of three-wheeled motor vehicle injured in collision with railway train or railway vehicle: Driver injured in traffic accident
V35.6|Occupant of three-wheeled motor vehicle injured in collision with railway train or railway vehicle: Passenger injured in traffic accident
V35.7|Occupant of three-wheeled motor vehicle injured in collision with railway train or railway vehicle: Person on outside of vehicle injured in traffic accident
V35.9|Occupant of three-wheeled motor vehicle injured in collision with railway train or railway vehicle: Unspecified occupant of three-wheeled motor vehicle injured in traffic accident
V36|Occupant of three-wheeled motor vehicle injured in collision with other nonmotor vehicle
V36.0|Occupant of three-wheeled motor vehicle injured in collision with other nonmotor vehicle: Driver injured in nontraffic accident
V36.1|Occupant of three-wheeled motor vehicle injured in collision with other nonmotor vehicle: Passenger injured in nontraffic accident
V36.2|Occupant of three-wheeled motor vehicle injured in collision with other nonmotor vehicle: Person on outside of vehicle injured in nontraffic accident
V36.3|Occupant of three-wheeled motor vehicle injured in collision with other nonmotor vehicle: Unspecified occupant of three-wheeled motor vehicle injured in nontraffic accident
V36.4|Occupant of three-wheeled motor vehicle injured in collision with other nonmotor vehicle: Person injured while boarding or alighting
V36.5|Occupant of three-wheeled motor vehicle injured in collision with other nonmotor vehicle: Driver injured in traffic accident
V36.6|Occupant of three-wheeled motor vehicle injured in collision with other nonmotor vehicle: Passenger injured in traffic accident
V36.7|Occupant of three-wheeled motor vehicle injured in collision with other nonmotor vehicle: Person on outside of vehicle injured in traffic accident
V36.9|Occupant of three-wheeled motor vehicle injured in collision with other nonmotor vehicle: Unspecified occupant of three-wheeled motor vehicle injured in traffic accident
V37|Occupant of three-wheeled motor vehicle injured in collision with fixed or stationary object
V37.0|Occupant of three-wheeled motor vehicle injured in collision with fixed or stationary object: Driver injured in nontraffic accident
V37.1|Occupant of three-wheeled motor vehicle injured in collision with fixed or stationary object: Passenger injured in nontraffic accident
V37.2|Occupant of three-wheeled motor vehicle injured in collision with fixed or stationary object: Person on outside of vehicle injured in nontraffic accident
V37.3|Occupant of three-wheeled motor vehicle injured in collision with fixed or stationary object: Unspecified occupant of three-wheeled motor vehicle injured in nontraffic accident
V37.4|Occupant of three-wheeled motor vehicle injured in collision with fixed or stationary object: Person injured while boarding or alighting
V37.5|Occupant of three-wheeled motor vehicle injured in collision with fixed or stationary object: Driver injured in traffic accident
V37.6|Occupant of three-wheeled motor vehicle injured in collision with fixed or stationary object: Passenger injured in traffic accident
V37.7|Occupant of three-wheeled motor vehicle injured in collision with fixed or stationary object: Person on outside of vehicle injured in traffic accident
V37.9|Occupant of three-wheeled motor vehicle injured in collision with fixed or stationary object: Unspecified occupant of three-wheeled motor vehicle injured in traffic accident
V38|Occupant of three-wheeled motor vehicle injured in noncollision transport accident
V38.0|Occupant of three-wheeled motor vehicle injured in noncollision transport accident: Driver injured in nontraffic accident
V38.1|Occupant of three-wheeled motor vehicle injured in noncollision transport accident: Passenger injured in nontraffic accident
V38.2|Occupant of three-wheeled motor vehicle injured in noncollision transport accident: Person on outside of vehicle injured in nontraffic accident
V38.3|Occupant of three-wheeled motor vehicle injured in noncollision transport accident: Unspecified occupant of three-wheeled motor vehicle injured in nontraffic accident
V38.4|Occupant of three-wheeled motor vehicle injured in noncollision transport accident: Person injured while boarding or alighting
V38.5|Occupant of three-wheeled motor vehicle injured in noncollision transport accident: Driver injured in traffic accident
V38.6|Occupant of three-wheeled motor vehicle injured in noncollision transport accident: Passenger injured in traffic accident
V38.7|Occupant of three-wheeled motor vehicle injured in noncollision transport accident: Person on outside of vehicle injured in traffic accident
V38.9|Occupant of three-wheeled motor vehicle injured in noncollision transport accident: Unspecified occupant of three-wheeled motor vehicle injured in traffic accident
V39|Occupant of three-wheeled motor vehicle injured in other and unspecified transport accidents
V39.0|Driver injured in collision with other and unspecified motor vehicles in nontraffic accident
V39.1|Passenger injured in collision with other and unspecified motor vehicles in nontraffic accident
V39.2|Unspecified occupant of three-wheeled motor vehicle injured in collision with other and unspecified motor vehicles in nontraffic accident
V39.3|Occupant [any] of three-wheeled motor vehicle injured in unspecified nontraffic accident
V39.4|Driver injured in collision with other and unspecified motor vehicles in traffic accident
V39.5|Passenger injured in collision with other and unspecified motor vehicles in traffic accident
V39.6|Unspecified occupant of three-wheeled motor vehicle injured in collision with other and unspecified motor vehicles in traffic accident
V39.8|Occupant [any] of three-wheeled motor vehicle injured in other specified transport accidents
V39.9|Occupant [any] of three-wheeled motor vehicle injured in unspecified traffic accident
V40|Car occupant injured in collision with pedestrian or animal
V40.0|Car occupant injured in collision with pedestrian or animal: Driver injured in nontraffic accident
V40.1|Car occupant injured in collision with pedestrian or animal: Passenger injured in nontraffic accident
V40.2|Car occupant injured in collision with pedestrian or animal: Person on outside of vehicle injured in nontraffic accident
V40.3|Car occupant injured in collision with pedestrian or animal: Unspecified car occupant injured in nontraffic accident
V40.4|Car occupant injured in collision with pedestrian or animal: Person injured while boarding or alighting
V40.5|Car occupant injured in collision with pedestrian or animal: Driver injured in traffic accident
V40.6|Car occupant injured in collision with pedestrian or animal: Passenger injured in traffic accident
V40.7|Car occupant injured in collision with pedestrian or animal: Person on outside of vehicle injured in traffic accident
V40.9|Car occupant injured in collision with pedestrian or animal: Unspecified car occupant injured in traffic accident
V41|Car occupant injured in collision with pedal cycle
V41.0|Car occupant injured in collision with pedal cycle: Driver injured in nontraffic accident
V41.1|Car occupant injured in collision with pedal cycle: Passenger injured in nontraffic accident
V41.2|Car occupant injured in collision with pedal cycle: Person on outside of vehicle injured in nontraffic accident
V41.3|Car occupant injured in collision with pedal cycle: Unspecified car occupant injured in nontraffic accident
V41.4|Car occupant injured in collision with pedal cycle: Person injured while boarding or alighting
V41.5|Car occupant injured in collision with pedal cycle: Driver injured in traffic accident
V41.6|Car occupant injured in collision with pedal cycle: Passenger injured in traffic accident
V41.7|Car occupant injured in collision with pedal cycle: Person on outside of vehicle injured in traffic accident
V41.9|Car occupant injured in collision with pedal cycle: Unspecified car occupant injured in traffic accident
V42|Car occupant injured in collision with two- or three-wheeled motor vehicle
V42.0|Car occupant injured in collision with two- or three-wheeled motor vehicle: Driver injured in nontraffic accident
V42.1|Car occupant injured in collision with two- or three-wheeled motor vehicle: Passenger injured in nontraffic accident
V42.2|Car occupant injured in collision with two- or three-wheeled motor vehicle: Person on outside of vehicle injured in nontraffic accident
V42.3|Car occupant injured in collision with two- or three-wheeled motor vehicle: Unspecified car occupant injured in nontraffic accident
V42.4|Car occupant injured in collision with two- or three-wheeled motor vehicle: Person injured while boarding or alighting
V42.5|Car occupant injured in collision with two- or three-wheeled motor vehicle: Driver injured in traffic accident
V42.6|Car occupant injured in collision with two- or three-wheeled motor vehicle: Passenger injured in traffic accident
V42.7|Car occupant injured in collision with two- or three-wheeled motor vehicle: Person on outside of vehicle injured in traffic accident
V42.9|Car occupant injured in collision with two- or three-wheeled motor vehicle: Unspecified car occupant injured in traffic accident
V43|Car occupant injured in collision with car, pick-up truck or van
V43.0|Car occupant injured in collision with car, pick-up truck or van: Driver injured in nontraffic accident
V43.1|Car occupant injured in collision with car, pick-up truck or van: Passenger injured in nontraffic accident
V43.2|Car occupant injured in collision with car, pick-up truck or van: Person on outside of vehicle injured in nontraffic accident
V43.3|Car occupant injured in collision with car, pick-up truck or van: Unspecified car occupant injured in nontraffic accident
V43.4|Car occupant injured in collision with car, pick-up truck or van: Person injured while boarding or alighting
V43.5|Car occupant injured in collision with car, pick-up truck or van: Driver injured in traffic accident
V43.6|Car occupant injured in collision with car, pick-up truck or van: Passenger injured in traffic accident
V43.7|Car occupant injured in collision with car, pick-up truck or van: Person on outside of vehicle injured in traffic accident
V43.9|Car occupant injured in collision with car, pick-up truck or van: Unspecified car occupant injured in traffic accident
V44|Car occupant injured in collision with heavy transport vehicle or bus
V44.0|Car occupant injured in collision with heavy transport vehicle or bus: Driver injured in nontraffic accident
V44.1|Car occupant injured in collision with heavy transport vehicle or bus: Passenger injured in nontraffic accident
V44.2|Car occupant injured in collision with heavy transport vehicle or bus: Person on outside of vehicle injured in nontraffic accident
V44.3|Car occupant injured in collision with heavy transport vehicle or bus: Unspecified car occupant injured in nontraffic accident
V44.4|Car occupant injured in collision with heavy transport vehicle or bus: Person injured while boarding or alighting
V44.5|Car occupant injured in collision with heavy transport vehicle or bus: Driver injured in traffic accident
V44.6|Car occupant injured in collision with heavy transport vehicle or bus: Passenger injured in traffic accident
V44.7|Car occupant injured in collision with heavy transport vehicle or bus: Person on outside of vehicle injured in traffic accident
V44.9|Car occupant injured in collision with heavy transport vehicle or bus: Unspecified car occupant injured in traffic accident
V45|Car occupant injured in collision with railway train or railway vehicle
V45.0|Car occupant injured in collision with railway train or railway vehicle: Driver injured in nontraffic accident
V45.1|Car occupant injured in collision with railway train or railway vehicle: Passenger injured in nontraffic accident
V45.2|Car occupant injured in collision with railway train or railway vehicle: Person on outside of vehicle injured in nontraffic accident
V45.3|Car occupant injured in collision with railway train or railway vehicle: Unspecified car occupant injured in nontraffic accident
V45.4|Car occupant injured in collision with railway train or railway vehicle: Person injured while boarding or alighting
V45.5|Car occupant injured in collision with railway train or railway vehicle: Driver injured in traffic accident
V45.6|Car occupant injured in collision with railway train or railway vehicle: Passenger injured in traffic accident
V45.7|Car occupant injured in collision with railway train or railway vehicle: Person on outside of vehicle injured in traffic accident
V45.9|Car occupant injured in collision with railway train or railway vehicle: Unspecified car occupant injured in traffic accident
V46|Car occupant injured in collision with other nonmotor vehicle
V46.0|Car occupant injured in collision with other nonmotor vehicle: Driver injured in nontraffic accident
V46.1|Car occupant injured in collision with other nonmotor vehicle: Passenger injured in nontraffic accident
V46.2|Car occupant injured in collision with other nonmotor vehicle: Person on outside of vehicle injured in nontraffic accident
V46.3|Car occupant injured in collision with other nonmotor vehicle: Unspecified car occupant injured in nontraffic accident
V46.4|Car occupant injured in collision with other nonmotor vehicle: Person injured while boarding or alighting
V46.5|Car occupant injured in collision with other nonmotor vehicle: Driver injured in traffic accident
V46.6|Car occupant injured in collision with other nonmotor vehicle: Passenger injured in traffic accident
V46.7|Car occupant injured in collision with other nonmotor vehicle: Person on outside of vehicle injured in traffic accident
V46.9|Car occupant injured in collision with other nonmotor vehicle: Unspecified car occupant injured in traffic accident
V47|Car occupant injured in collision with fixed or stationary object
V47.0|Car occupant injured in collision with fixed or stationary object: Driver injured in nontraffic accident
V47.1|Car occupant injured in collision with fixed or stationary object: Passenger injured in nontraffic accident
V47.2|Car occupant injured in collision with fixed or stationary object: Person on outside of vehicle injured in nontraffic accident
V47.3|Car occupant injured in collision with fixed or stationary object: Unspecified car occupant injured in nontraffic accident
V47.4|Car occupant injured in collision with fixed or stationary object: Person injured while boarding or alighting
V47.5|Car occupant injured in collision with fixed or stationary object: Driver injured in traffic accident
V47.6|Car occupant injured in collision with fixed or stationary object: Passenger injured in traffic accident
V47.7|Car occupant injured in collision with fixed or stationary object: Person on outside of vehicle injured in traffic accident
V47.9|Car occupant injured in collision with fixed or stationary object: Unspecified car occupant injured in traffic accident
V48|Car occupant injured in noncollision transport accident
V48.0|Car occupant injured in noncollision transport accident: Driver injured in nontraffic accident
V48.1|Car occupant injured in noncollision transport accident: Passenger injured in nontraffic accident
V48.2|Car occupant injured in noncollision transport accident: Person on outside of vehicle injured in nontraffic accident
V48.3|Car occupant injured in noncollision transport accident: Unspecified car occupant injured in nontraffic accident
V48.4|Car occupant injured in noncollision transport accident: Person injured while boarding or alighting
V48.5|Car occupant injured in noncollision transport accident: Driver injured in traffic accident
V48.6|Car occupant injured in noncollision transport accident: Passenger injured in traffic accident
V48.7|Car occupant injured in noncollision transport accident: Person on outside of vehicle injured in traffic accident
V48.9|Car occupant injured in noncollision transport accident: Unspecified car occupant injured in traffic accident
V49|Car occupant injured in other and unspecified transport accidents
V49.0|Driver injured in collision with other and unspecified motor vehicles in nontraffic accident
V49.1|Passenger injured in collision with other and unspecified motor vehicles in nontraffic accident
V49.2|Unspecified car occupant injured in collision with other and unspecified motor vehicles in nontraffic accident
V49.3|Car occupant [any] injured in unspecified nontraffic accident
V49.4|Driver injured in collision with other and unspecified motor vehicles in traffic accident
V49.5|Passenger injured in collision with other and unspecified motor vehicles in traffic accident
V49.6|Unspecified car occupant injured in collision with other and unspecified motor vehicles in traffic accident
V49.8|Car occupant [any] injured in other specified transport accidents
V49.9|Car occupant [any] injured in unspecified traffic accident
V50|Occupant of pick-up truck or van injured in collision with pedestrian or animal
V50.0|Occupant of pick-up truck or van injured in collision with pedestrian or animal: Driver injured in nontraffic accident
V50.1|Occupant of pick-up truck or van injured in collision with pedestrian or animal: Passenger injured in nontraffic accident
V50.2|Occupant of pick-up truck or van injured in collision with pedestrian or animal: Person on outside of vehicle injured in nontraffic accident
V50.3|Occupant of pick-up truck or van injured in collision with pedestrian or animal: Unspecified occupant of pick-up truck or van injured in nontraffic accident
V50.4|Occupant of pick-up truck or van injured in collision with pedestrian or animal: Person injured while boarding or alighting
V50.5|Occupant of pick-up truck or van injured in collision with pedestrian or animal: Driver injured in traffic accident
V50.6|Occupant of pick-up truck or van injured in collision with pedestrian or animal: Passenger injured in traffic accident
V50.7|Occupant of pick-up truck or van injured in collision with pedestrian or animal: Person on outside of vehicle injured in traffic accident
V50.9|Occupant of pick-up truck or van injured in collision with pedestrian or animal: Unspecified occupant of pick-up truck or van injured in traffic accident
V51|Occupant of pick-up truck or van injured in collision with pedal cycle
V51.0|Occupant of pick-up truck or van injured in collision with pedal cycle: Driver injured in nontraffic accident
V51.1|Occupant of pick-up truck or van injured in collision with pedal cycle: Passenger injured in nontraffic accident
V51.2|Occupant of pick-up truck or van injured in collision with pedal cycle: Person on outside of vehicle injured in nontraffic accident
V51.3|Occupant of pick-up truck or van injured in collision with pedal cycle: Unspecified occupant of pick-up truck or van injured in nontraffic accident
V51.4|Occupant of pick-up truck or van injured in collision with pedal cycle: Person injured while boarding or alighting
V51.5|Occupant of pick-up truck or van injured in collision with pedal cycle: Driver injured in traffic accident
V51.6|Occupant of pick-up truck or van injured in collision with pedal cycle: Passenger injured in traffic accident
V51.7|Occupant of pick-up truck or van injured in collision with pedal cycle: Person on outside of vehicle injured in traffic accident
V51.9|Occupant of pick-up truck or van injured in collision with pedal cycle: Unspecified occupant of pick-up truck or van injured in traffic accident
V52|Occupant of pick-up truck or van injured in collision with two- or three-wheeled motor vehicle
V52.0|Occupant of pick-up truck or van injured in collision with two- or three-wheeled motor vehicle: Driver injured in nontraffic accident
V52.1|Occupant of pick-up truck or van injured in collision with two- or three-wheeled motor vehicle: Passenger injured in nontraffic accident
V52.2|Occupant of pick-up truck or van injured in collision with two- or three-wheeled motor vehicle: Person on outside of vehicle injured in nontraffic accident
V52.3|Occupant of pick-up truck or van injured in collision with two- or three-wheeled motor vehicle: Unspecified occupant of pick-up truck or van injured in nontraffic accident
V52.4|Occupant of pick-up truck or van injured in collision with two- or three-wheeled motor vehicle: Person injured while boarding or alighting
V52.5|Occupant of pick-up truck or van injured in collision with two- or three-wheeled motor vehicle: Driver injured in traffic accident
V52.6|Occupant of pick-up truck or van injured in collision with two- or three-wheeled motor vehicle: Passenger injured in traffic accident
V52.7|Occupant of pick-up truck or van injured in collision with two- or three-wheeled motor vehicle: Person on outside of vehicle injured in traffic accident
V52.9|Occupant of pick-up truck or van injured in collision with two- or three-wheeled motor vehicle: Unspecified occupant of pick-up truck or van injured in traffic accident
V53|Occupant of pick-up truck or van injured in collision with car, pick-up truck or van
V53.0|Occupant of pick-up truck or van injured in collision with car, pick-up truck or van: Driver injured in nontraffic accident
V53.1|Occupant of pick-up truck or van injured in collision with car, pick-up truck or van: Passenger injured in nontraffic accident
V53.2|Occupant of pick-up truck or van injured in collision with car, pick-up truck or van: Person on outside of vehicle injured in nontraffic accident
V53.3|Occupant of pick-up truck or van injured in collision with car, pick-up truck or van: Unspecified occupant of pick-up truck or van injured in nontraffic accident
V53.4|Occupant of pick-up truck or van injured in collision with car, pick-up truck or van: Person injured while boarding or alighting
V53.5|Occupant of pick-up truck or van injured in collision with car, pick-up truck or van: Driver injured in traffic accident
V53.6|Occupant of pick-up truck or van injured in collision with car, pick-up truck or van: Passenger injured in traffic accident
V53.7|Occupant of pick-up truck or van injured in collision with car, pick-up truck or van: Person on outside of vehicle injured in traffic accident
V53.9|Occupant of pick-up truck or van injured in collision with car, pick-up truck or van: Unspecified occupant of pick-up truck or van injured in traffic accident
V54|Occupant of pick-up truck or van injured in collision with heavy transport vehicle or bus
V54.0|Occupant of pick-up truck or van injured in collision with heavy transport vehicle or bus: Driver injured in nontraffic accident
V54.1|Occupant of pick-up truck or van injured in collision with heavy transport vehicle or bus: Passenger injured in nontraffic accident
V54.2|Occupant of pick-up truck or van injured in collision with heavy transport vehicle or bus: Person on outside of vehicle injured in nontraffic accident
V54.3|Occupant of pick-up truck or van injured in collision with heavy transport vehicle or bus: Unspecified occupant of pick-up truck or van injured in nontraffic accident
V54.4|Occupant of pick-up truck or van injured in collision with heavy transport vehicle or bus: Person injured while boarding or alighting
V54.5|Occupant of pick-up truck or van injured in collision with heavy transport vehicle or bus: Driver injured in traffic accident
V54.6|Occupant of pick-up truck or van injured in collision with heavy transport vehicle or bus: Passenger injured in traffic accident
V54.7|Occupant of pick-up truck or van injured in collision with heavy transport vehicle or bus: Person on outside of vehicle injured in traffic accident
V54.9|Occupant of pick-up truck or van injured in collision with heavy transport vehicle or bus: Unspecified occupant of pick-up truck or van injured in traffic accident
V55|Occupant of pick-up truck or van injured in collision with railway train or railway vehicle
V55.0|Occupant of pick-up truck or van injured in collision with railway train or railway vehicle: Driver injured in nontraffic accident
V55.1|Occupant of pick-up truck or van injured in collision with railway train or railway vehicle: Passenger injured in nontraffic accident
V55.2|Occupant of pick-up truck or van injured in collision with railway train or railway vehicle: Person on outside of vehicle injured in nontraffic accident
V55.3|Occupant of pick-up truck or van injured in collision with railway train or railway vehicle: Unspecified occupant of pick-up truck or van injured in nontraffic accident
V55.4|Occupant of pick-up truck or van injured in collision with railway train or railway vehicle: Person injured while boarding or alighting
V55.5|Occupant of pick-up truck or van injured in collision with railway train or railway vehicle: Driver injured in traffic accident
V55.6|Occupant of pick-up truck or van injured in collision with railway train or railway vehicle: Passenger injured in traffic accident
V55.7|Occupant of pick-up truck or van injured in collision with railway train or railway vehicle: Person on outside of vehicle injured in traffic accident
V55.9|Occupant of pick-up truck or van injured in collision with railway train or railway vehicle: Unspecified occupant of pick-up truck or van injured in traffic accident
V56|Occupant of pick-up truck or van injured in collision with other nonmotor vehicle
V56.0|Occupant of pick-up truck or van injured in collision with other nonmotor vehicle: Driver injured in nontraffic accident
V56.1|Occupant of pick-up truck or van injured in collision with other nonmotor vehicle: Passenger injured in nontraffic accident
V56.2|Occupant of pick-up truck or van injured in collision with other nonmotor vehicle: Person on outside of vehicle injured in nontraffic accident
V56.3|Occupant of pick-up truck or van injured in collision with other nonmotor vehicle: Unspecified occupant of pick-up truck or van injured in nontraffic accident
V56.4|Occupant of pick-up truck or van injured in collision with other nonmotor vehicle: Person injured while boarding or alighting
V56.5|Occupant of pick-up truck or van injured in collision with other nonmotor vehicle: Driver injured in traffic accident
V56.6|Occupant of pick-up truck or van injured in collision with other nonmotor vehicle: Passenger injured in traffic accident
V56.7|Occupant of pick-up truck or van injured in collision with other nonmotor vehicle: Person on outside of vehicle injured in traffic accident
V56.9|Occupant of pick-up truck or van injured in collision with other nonmotor vehicle: Unspecified occupant of pick-up truck or van injured in traffic accident
V57|Occupant of pick-up truck or van injured in collision with fixed or stationary object
V57.0|Occupant of pick-up truck or van injured in collision with fixed or stationary object: Driver injured in nontraffic accident
V57.1|Occupant of pick-up truck or van injured in collision with fixed or stationary object: Passenger injured in nontraffic accident
V57.2|Occupant of pick-up truck or van injured in collision with fixed or stationary object: Person on outside of vehicle injured in nontraffic accident
V57.3|Occupant of pick-up truck or van injured in collision with fixed or stationary object: Unspecified occupant of pick-up truck or van injured in nontraffic accident
V57.4|Occupant of pick-up truck or van injured in collision with fixed or stationary object: Person injured while boarding or alighting
V57.5|Occupant of pick-up truck or van injured in collision with fixed or stationary object: Driver injured in traffic accident
V57.6|Occupant of pick-up truck or van injured in collision with fixed or stationary object: Passenger injured in traffic accident
V57.7|Occupant of pick-up truck or van injured in collision with fixed or stationary object: Person on outside of vehicle injured in traffic accident
V57.9|Occupant of pick-up truck or van injured in collision with fixed or stationary object: Unspecified occupant of pick-up truck or van injured in traffic accident
V58|Occupant of pick-up truck or van injured in noncollision transport accident
V58.0|Occupant of pick-up truck or van injured in noncollision transport accident: Driver injured in nontraffic accident
V58.1|Occupant of pick-up truck or van injured in noncollision transport accident: Passenger injured in nontraffic accident
V58.2|Occupant of pick-up truck or van injured in noncollision transport accident: Person on outside of vehicle injured in nontraffic accident
V58.3|Occupant of pick-up truck or van injured in noncollision transport accident: Unspecified occupant of pick-up truck or van injured in nontraffic accident
V58.4|Occupant of pick-up truck or van injured in noncollision transport accident: Person injured while boarding or alighting
V58.5|Occupant of pick-up truck or van injured in noncollision transport accident: Driver injured in traffic accident
V58.6|Occupant of pick-up truck or van injured in noncollision transport accident: Passenger injured in traffic accident
V58.7|Occupant of pick-up truck or van injured in noncollision transport accident: Person on outside of vehicle injured in traffic accident
V58.9|Occupant of pick-up truck or van injured in noncollision transport accident: Unspecified occupant of pick-up truck or van injured in traffic accident
V59|Occupant of pick-up truck or van injured in other and unspecified transport accidents
V59.0|Driver injured in collision with other and unspecified motor vehicles in nontraffic accident
V59.1|Passenger injured in collision with other and unspecified motor vehicles in nontraffic accident
V59.2|Unspecified occupant of pick-up truck or van injured in collision with other and unspecified motor vehicles in nontraffic accident
V59.3|Occupant [any] of pick-up truck or van injured in unspecified nontraffic accident
V59.4|Driver injured in collision with other and unspecified motor vehicles in traffic accident
V59.5|Passenger injured in collision with other and unspecified motor vehicles in traffic accident
V59.6|Unspecified occupant of pick-up truck or van injured in collision with other and unspecified motor vehicles in traffic accident
V59.8|Occupant [any] of pick-up truck or van injured in other specified transport accidents
V59.9|Occupant [any] of pick-up truck or van injured in unspecified traffic accident
V60|Occupant of heavy transport vehicle injured in collision with pedestrian or animal
V60.0|Occupant of heavy transport vehicle injured in collision with pedestrian or animal: Driver injured in nontraffic accident
V60.1|Occupant of heavy transport vehicle injured in collision with pedestrian or animal: Passenger injured in nontraffic accident
V60.2|Occupant of heavy transport vehicle injured in collision with pedestrian or animal: Person on outside of vehicle injured in nontraffic accident
V60.3|Occupant of heavy transport vehicle injured in collision with pedestrian or animal: Unspecified occupant of heavy transport vehicle injured in nontraffic accident
V60.4|Occupant of heavy transport vehicle injured in collision with pedestrian or animal: Person injured while boarding or alighting
V60.5|Occupant of heavy transport vehicle injured in collision with pedestrian or animal: Driver injured in traffic accident
V60.6|Occupant of heavy transport vehicle injured in collision with pedestrian or animal: Passenger injured in traffic accident
V60.7|Occupant of heavy transport vehicle injured in collision with pedestrian or animal: Person on outside of vehicle injured in traffic accident
V60.9|Occupant of heavy transport vehicle injured in collision with pedestrian or animal: Unspecified occupant of heavy transport vehicle injured in traffic accident
V61|Occupant of heavy transport vehicle injured in collision with pedal cycle
V61.0|Occupant of heavy transport vehicle injured in collision with pedal cycle: Driver injured in nontraffic accident
V61.1|Occupant of heavy transport vehicle injured in collision with pedal cycle: Passenger injured in nontraffic accident
V61.2|Occupant of heavy transport vehicle injured in collision with pedal cycle: Person on outside of vehicle injured in nontraffic accident
V61.3|Occupant of heavy transport vehicle injured in collision with pedal cycle: Unspecified occupant of heavy transport vehicle injured in nontraffic accident
V61.4|Occupant of heavy transport vehicle injured in collision with pedal cycle: Person injured while boarding or alighting
V61.5|Occupant of heavy transport vehicle injured in collision with pedal cycle: Driver injured in traffic accident
V61.6|Occupant of heavy transport vehicle injured in collision with pedal cycle: Passenger injured in traffic accident
V61.7|Occupant of heavy transport vehicle injured in collision with pedal cycle: Person on outside of vehicle injured in traffic accident
V61.9|Occupant of heavy transport vehicle injured in collision with pedal cycle: Unspecified occupant of heavy transport vehicle injured in traffic accident
V62|Occupant of heavy transport vehicle injured in collision with two- or three-wheeled motor vehicle
V62.0|Occupant of heavy transport vehicle injured in collision with two- or three-wheeled motor vehicle: Driver injured in nontraffic accident
V62.1|Occupant of heavy transport vehicle injured in collision with two- or three-wheeled motor vehicle: Passenger injured in nontraffic accident
V62.2|Occupant of heavy transport vehicle injured in collision with two- or three-wheeled motor vehicle: Person on outside of vehicle injured in nontraffic accident
V62.3|Occupant of heavy transport vehicle injured in collision with two- or three-wheeled motor vehicle: Unspecified occupant of heavy transport vehicle injured in nontraffic accident
V62.4|Occupant of heavy transport vehicle injured in collision with two- or three-wheeled motor vehicle: Person injured while boarding or alighting
V62.5|Occupant of heavy transport vehicle injured in collision with two- or three-wheeled motor vehicle: Driver injured in traffic accident
V62.6|Occupant of heavy transport vehicle injured in collision with two- or three-wheeled motor vehicle: Passenger injured in traffic accident
V62.7|Occupant of heavy transport vehicle injured in collision with two- or three-wheeled motor vehicle: Person on outside of vehicle injured in traffic accident
V62.9|Occupant of heavy transport vehicle injured in collision with two- or three-wheeled motor vehicle: Unspecified occupant of heavy transport vehicle injured in traffic accident
V63|Occupant of heavy transport vehicle injured in collision with car, pick-up truck or van
V63.0|Occupant of heavy transport vehicle injured in collision with car, pick-up truck or van: Driver injured in nontraffic accident
V63.1|Occupant of heavy transport vehicle injured in collision with car, pick-up truck or van: Passenger injured in nontraffic accident
V63.2|Occupant of heavy transport vehicle injured in collision with car, pick-up truck or van: Person on outside of vehicle injured in nontraffic accident
V63.3|Occupant of heavy transport vehicle injured in collision with car, pick-up truck or van: Unspecified occupant of heavy transport vehicle injured in nontraffic accident
V63.4|Occupant of heavy transport vehicle injured in collision with car, pick-up truck or van: Person injured while boarding or alighting
V63.5|Occupant of heavy transport vehicle injured in collision with car, pick-up truck or van: Driver injured in traffic accident
V63.6|Occupant of heavy transport vehicle injured in collision with car, pick-up truck or van: Passenger injured in traffic accident
V63.7|Occupant of heavy transport vehicle injured in collision with car, pick-up truck or van: Person on outside of vehicle injured in traffic accident
V63.9|Occupant of heavy transport vehicle injured in collision with car, pick-up truck or van: Unspecified occupant of heavy transport vehicle injured in traffic accident
V64|Occupant of heavy transport vehicle injured in collision with heavy transport vehicle or bus
V64.0|Occupant of heavy transport vehicle injured in collision with heavy transport vehicle or bus: Driver injured in nontraffic accident
V64.1|Occupant of heavy transport vehicle injured in collision with heavy transport vehicle or bus: Passenger injured in nontraffic accident
V64.2|Occupant of heavy transport vehicle injured in collision with heavy transport vehicle or bus: Person on outside of vehicle injured in nontraffic accident
V64.3|Occupant of heavy transport vehicle injured in collision with heavy transport vehicle or bus: Unspecified occupant of heavy transport vehicle injured in nontraffic accident
V64.4|Occupant of heavy transport vehicle injured in collision with heavy transport vehicle or bus: Person injured while boarding or alighting
V64.5|Occupant of heavy transport vehicle injured in collision with heavy transport vehicle or bus: Driver injured in traffic accident
V64.6|Occupant of heavy transport vehicle injured in collision with heavy transport vehicle or bus: Passenger injured in traffic accident
V64.7|Occupant of heavy transport vehicle injured in collision with heavy transport vehicle or bus: Person on outside of vehicle injured in traffic accident
V64.9|Occupant of heavy transport vehicle injured in collision with heavy transport vehicle or bus: Unspecified occupant of heavy transport vehicle injured in traffic accident
V65|Occupant of heavy transport vehicle injured in collision with railway train or railway vehicle
V65.0|Occupant of heavy transport vehicle injured in collision with railway train or railway vehicle: Driver injured in nontraffic accident
V65.1|Occupant of heavy transport vehicle injured in collision with railway train or railway vehicle: Passenger injured in nontraffic accident
V65.2|Occupant of heavy transport vehicle injured in collision with railway train or railway vehicle: Person on outside of vehicle injured in nontraffic accident
V65.3|Occupant of heavy transport vehicle injured in collision with railway train or railway vehicle: Unspecified occupant of heavy transport vehicle injured in nontraffic accident
V65.4|Occupant of heavy transport vehicle injured in collision with railway train or railway vehicle: Person injured while boarding or alighting
V65.5|Occupant of heavy transport vehicle injured in collision with railway train or railway vehicle: Driver injured in traffic accident
V65.6|Occupant of heavy transport vehicle injured in collision with railway train or railway vehicle: Passenger injured in traffic accident
V65.7|Occupant of heavy transport vehicle injured in collision with railway train or railway vehicle: Person on outside of vehicle injured in traffic accident
V65.9|Occupant of heavy transport vehicle injured in collision with railway train or railway vehicle: Unspecified occupant of heavy transport vehicle injured in traffic accident
V66|Occupant of heavy transport vehicle injured in collision with other nonmotor vehicle
V66.0|Occupant of heavy transport vehicle injured in collision with other nonmotor vehicle: Driver injured in nontraffic accident
V66.1|Occupant of heavy transport vehicle injured in collision with other nonmotor vehicle: Passenger injured in nontraffic accident
V66.2|Occupant of heavy transport vehicle injured in collision with other nonmotor vehicle: Person on outside of vehicle injured in nontraffic accident
V66.3|Occupant of heavy transport vehicle injured in collision with other nonmotor vehicle: Unspecified occupant of heavy transport vehicle injured in nontraffic accident
V66.4|Occupant of heavy transport vehicle injured in collision with other nonmotor vehicle: Person injured while boarding or alighting
V66.5|Occupant of heavy transport vehicle injured in collision with other nonmotor vehicle: Driver injured in traffic accident
V66.6|Occupant of heavy transport vehicle injured in collision with other nonmotor vehicle: Passenger injured in traffic accident
V66.7|Occupant of heavy transport vehicle injured in collision with other nonmotor vehicle: Person on outside of vehicle injured in traffic accident
V66.9|Occupant of heavy transport vehicle injured in collision with other nonmotor vehicle: Unspecified occupant of heavy transport vehicle injured in traffic accident
V67|Occupant of heavy transport vehicle injured in collision with fixed or stationary object
V67.0|Occupant of heavy transport vehicle injured in collision with fixed or stationary object: Driver injured in nontraffic accident
V67.1|Occupant of heavy transport vehicle injured in collision with fixed or stationary object: Passenger injured in nontraffic accident
V67.2|Occupant of heavy transport vehicle injured in collision with fixed or stationary object: Person on outside of vehicle injured in nontraffic accident
V67.3|Occupant of heavy transport vehicle injured in collision with fixed or stationary object: Unspecified occupant of heavy transport vehicle injured in nontraffic accident
V67.4|Occupant of heavy transport vehicle injured in collision with fixed or stationary object: Person injured while boarding or alighting
V67.5|Occupant of heavy transport vehicle injured in collision with fixed or stationary object: Driver injured in traffic accident
V67.6|Occupant of heavy transport vehicle injured in collision with fixed or stationary object: Passenger injured in traffic accident
V67.7|Occupant of heavy transport vehicle injured in collision with fixed or stationary object: Person on outside of vehicle injured in traffic accident
V67.9|Occupant of heavy transport vehicle injured in collision with fixed or stationary object: Unspecified occupant of heavy transport vehicle injured in traffic accident
V68|Occupant of heavy transport vehicle injured in noncollision transport accident
V68.0|Occupant of heavy transport vehicle injured in noncollision transport accident: Driver injured in nontraffic accident
V68.1|Occupant of heavy transport vehicle injured in noncollision transport accident: Passenger injured in nontraffic accident
V68.2|Occupant of heavy transport vehicle injured in noncollision transport accident: Person on outside of vehicle injured in nontraffic accident
V68.3|Occupant of heavy transport vehicle injured in noncollision transport accident: Unspecified occupant of heavy transport vehicle injured in nontraffic accident
V68.4|Occupant of heavy transport vehicle injured in noncollision transport accident: Person injured while boarding or alighting
V68.5|Occupant of heavy transport vehicle injured in noncollision transport accident: Driver injured in traffic accident
V68.6|Occupant of heavy transport vehicle injured in noncollision transport accident: Passenger injured in traffic accident
V68.7|Occupant of heavy transport vehicle injured in noncollision transport accident: Person on outside of vehicle injured in traffic accident
V68.9|Occupant of heavy transport vehicle injured in noncollision transport accident: Unspecified occupant of heavy transport vehicle injured in traffic accident
V69|Occupant of heavy transport vehicle injured in other and unspecified transport accidents
V69.0|Driver injured in collision with other and unspecified motor vehicles in nontraffic accident
V69.1|Passenger injured in collision with other and unspecified motor vehicles in nontraffic accident
V69.2|Unspecified occupant of heavy transport vehicle injured in collision with other and unspecified motor vehicles in nontraffic accident
V69.3|Occupant [any] of heavy transport vehicle injured in unspecified nontraffic accident
V69.4|Driver injured in collision with other and unspecified motor vehicles in traffic accident
V69.5|Passenger injured in collision with other and unspecified motor vehicles in traffic accident
V69.6|Unspecified occupant of heavy transport vehicle injured in collision with other and unspecified motor vehicles in traffic accident
V69.8|Occupant [any] of heavy transport vehicle injured in other specified transport accidents
V69.9|Occupant [any] of heavy transport vehicle injured in unspecified traffic accident
V70|Bus occupant injured in collision with pedestrian or animal
V70.0|Bus occupant injured in collision with pedestrian or animal: Driver injured in nontraffic accident
V70.1|Bus occupant injured in collision with pedestrian or animal: Passenger injured in nontraffic accident
V70.2|Bus occupant injured in collision with pedestrian or animal: Person on outside of vehicle injured in nontraffic accident
V70.3|Bus occupant injured in collision with pedestrian or animal: Unspecified bus occupant injured in nontraffic accident
V70.4|Bus occupant injured in collision with pedestrian or animal: Person injured while boarding or alighting
V70.5|Bus occupant injured in collision with pedestrian or animal: Driver injured in traffic accident
V70.6|Bus occupant injured in collision with pedestrian or animal: Passenger injured in traffic accident
V70.7|Bus occupant injured in collision with pedestrian or animal: Person on outside of vehicle injured in traffic accident
V70.9|Bus occupant injured in collision with pedestrian or animal: Unspecified bus occupant injured in traffic accident
V71|Bus occupant injured in collision with pedal cycle
V71.0|Bus occupant injured in collision with pedal cycle: Driver injured in nontraffic accident
V71.1|Bus occupant injured in collision with pedal cycle: Passenger injured in nontraffic accident
V71.2|Bus occupant injured in collision with pedal cycle: Person on outside of vehicle injured in nontraffic accident
V71.3|Bus occupant injured in collision with pedal cycle: Unspecified bus occupant injured in nontraffic accident
V71.4|Bus occupant injured in collision with pedal cycle: Person injured while boarding or alighting
V71.5|Bus occupant injured in collision with pedal cycle: Driver injured in traffic accident
V71.6|Bus occupant injured in collision with pedal cycle: Passenger injured in traffic accident
V71.7|Bus occupant injured in collision with pedal cycle: Person on outside of vehicle injured in traffic accident
V71.9|Bus occupant injured in collision with pedal cycle: Unspecified bus occupant injured in traffic accident
V72|Bus occupant injured in collision with two- or three-wheeled motor vehicle
V72.0|Bus occupant injured in collision with two- or three-wheeled motor vehicle: Driver injured in nontraffic accident
V72.1|Bus occupant injured in collision with two- or three-wheeled motor vehicle: Passenger injured in nontraffic accident
V72.2|Bus occupant injured in collision with two- or three-wheeled motor vehicle: Person on outside of vehicle injured in nontraffic accident
V72.3|Bus occupant injured in collision with two- or three-wheeled motor vehicle: Unspecified bus occupant injured in nontraffic accident
V72.4|Bus occupant injured in collision with two- or three-wheeled motor vehicle: Person injured while boarding or alighting
V72.5|Bus occupant injured in collision with two- or three-wheeled motor vehicle: Driver injured in traffic accident
V72.6|Bus occupant injured in collision with two- or three-wheeled motor vehicle: Passenger injured in traffic accident
V72.7|Bus occupant injured in collision with two- or three-wheeled motor vehicle: Person on outside of vehicle injured in traffic accident
V72.9|Bus occupant injured in collision with two- or three-wheeled motor vehicle: Unspecified bus occupant injured in traffic accident
V73|Bus occupant injured in collision with car, pick-up truck or van
V73.0|Bus occupant injured in collision with car, pick-up truck or van: Driver injured in nontraffic accident
V73.1|Bus occupant injured in collision with car, pick-up truck or van: Passenger injured in nontraffic accident
V73.2|Bus occupant injured in collision with car, pick-up truck or van: Person on outside of vehicle injured in nontraffic accident
V73.3|Bus occupant injured in collision with car, pick-up truck or van: Unspecified bus occupant injured in nontraffic accident
V73.4|Bus occupant injured in collision with car, pick-up truck or van: Person injured while boarding or alighting
V73.5|Bus occupant injured in collision with car, pick-up truck or van: Driver injured in traffic accident
V73.6|Bus occupant injured in collision with car, pick-up truck or van: Passenger injured in traffic accident
V73.7|Bus occupant injured in collision with car, pick-up truck or van: Person on outside of vehicle injured in traffic accident
V73.9|Bus occupant injured in collision with car, pick-up truck or van: Unspecified bus occupant injured in traffic accident
V74|Bus occupant injured in collision with heavy transport vehicle or bus
V74.0|Bus occupant injured in collision with heavy transport vehicle or bus: Driver injured in nontraffic accident
V74.1|Bus occupant injured in collision with heavy transport vehicle or bus: Passenger injured in nontraffic accident
V74.2|Bus occupant injured in collision with heavy transport vehicle or bus: Person on outside of vehicle injured in nontraffic accident
V74.3|Bus occupant injured in collision with heavy transport vehicle or bus: Unspecified bus occupant injured in nontraffic accident
V74.4|Bus occupant injured in collision with heavy transport vehicle or bus: Person injured while boarding or alighting
V74.5|Bus occupant injured in collision with heavy transport vehicle or bus: Driver injured in traffic accident
V74.6|Bus occupant injured in collision with heavy transport vehicle or bus: Passenger injured in traffic accident
V74.7|Bus occupant injured in collision with heavy transport vehicle or bus: Person on outside of vehicle injured in traffic accident
V74.9|Bus occupant injured in collision with heavy transport vehicle or bus: Unspecified bus occupant injured in traffic accident
V75|Bus occupant injured in collision with railway train or railway vehicle
V75.0|Bus occupant injured in collision with railway train or railway vehicle: Driver injured in nontraffic accident
V75.1|Bus occupant injured in collision with railway train or railway vehicle: Passenger injured in nontraffic accident
V75.2|Bus occupant injured in collision with railway train or railway vehicle: Person on outside of vehicle injured in nontraffic accident
V75.3|Bus occupant injured in collision with railway train or railway vehicle: Unspecified bus occupant injured in nontraffic accident
V75.4|Bus occupant injured in collision with railway train or railway vehicle: Person injured while boarding or alighting
V75.5|Bus occupant injured in collision with railway train or railway vehicle: Driver injured in traffic accident
V75.6|Bus occupant injured in collision with railway train or railway vehicle: Passenger injured in traffic accident
V75.7|Bus occupant injured in collision with railway train or railway vehicle: Person on outside of vehicle injured in traffic accident
V75.9|Bus occupant injured in collision with railway train or railway vehicle: Unspecified bus occupant injured in traffic accident
V76|Bus occupant injured in collision with other nonmotor vehicle
V76.0|Bus occupant injured in collision with other nonmotor vehicle: Driver injured in nontraffic accident
V76.1|Bus occupant injured in collision with other nonmotor vehicle: Passenger injured in nontraffic accident
V76.2|Bus occupant injured in collision with other nonmotor vehicle: Person on outside of vehicle injured in nontraffic accident
V76.3|Bus occupant injured in collision with other nonmotor vehicle: Unspecified bus occupant injured in nontraffic accident
V76.4|Bus occupant injured in collision with other nonmotor vehicle: Person injured while boarding or alighting
V76.5|Bus occupant injured in collision with other nonmotor vehicle: Driver injured in traffic accident
V76.6|Bus occupant injured in collision with other nonmotor vehicle: Passenger injured in traffic accident
V76.7|Bus occupant injured in collision with other nonmotor vehicle: Person on outside of vehicle injured in traffic accident
V76.9|Bus occupant injured in collision with other nonmotor vehicle: Unspecified bus occupant injured in traffic accident
V77|Bus occupant injured in collision with fixed or stationary object
V77.0|Bus occupant injured in collision with fixed or stationary object: Driver injured in nontraffic accident
V77.1|Bus occupant injured in collision with fixed or stationary object: Passenger injured in nontraffic accident
V77.2|Bus occupant injured in collision with fixed or stationary object: Person on outside of vehicle injured in nontraffic accident
V77.3|Bus occupant injured in collision with fixed or stationary object: Unspecified bus occupant injured in nontraffic accident
V77.4|Bus occupant injured in collision with fixed or stationary object: Person injured while boarding or alighting
V77.5|Bus occupant injured in collision with fixed or stationary object: Driver injured in traffic accident
V77.6|Bus occupant injured in collision with fixed or stationary object: Passenger injured in traffic accident
V77.7|Bus occupant injured in collision with fixed or stationary object: Person on outside of vehicle injured in traffic accident
V77.9|Bus occupant injured in collision with fixed or stationary object: Unspecified bus occupant injured in traffic accident
V78|Bus occupant injured in noncollision transport accident
V78.0|Bus occupant injured in noncollision transport accident: Driver injured in nontraffic accident
V78.1|Bus occupant injured in noncollision transport accident: Passenger injured in nontraffic accident
V78.2|Bus occupant injured in noncollision transport accident: Person on outside of vehicle injured in nontraffic accident
V78.3|Bus occupant injured in noncollision transport accident: Unspecified bus occupant injured in nontraffic accident
V78.4|Bus occupant injured in noncollision transport accident: Person injured while boarding or alighting
V78.5|Bus occupant injured in noncollision transport accident: Driver injured in traffic accident
V78.6|Bus occupant injured in noncollision transport accident: Passenger injured in traffic accident
V78.7|Bus occupant injured in noncollision transport accident: Person on outside of vehicle injured in traffic accident
V78.9|Bus occupant injured in noncollision transport accident: Unspecified bus occupant injured in traffic accident
V79|Bus occupant injured in other and unspecified transport accidents
V79.0|Driver injured in collision with other and unspecified motor vehicles in nontraffic accident
V79.1|Passenger injured in collision with other and unspecified motor vehicles in nontraffic accident
V79.2|Unspecified bus occupant injured in collision with other and unspecified motor vehicles in nontraffic accident
V79.3|Bus occupant [any] injured in unspecified nontraffic accident
V79.4|Driver injured in collision with other and unspecified motor vehicles in traffic accident
V79.5|Passenger injured in collision with other and unspecified motor vehicles in traffic accident
V79.6|Unspecified bus occupant injured in collision with other and unspecified motor vehicles in traffic accident
V79.8|Bus occupant [any] injured in other specified transport accidents
V79.9|Bus occupant [any] injured in unspecified traffic accident
V80|Animal-rider or occupant of animal-drawn vehicle injured in transport accident
V80.0|Rider or occupant injured by fall from or being thrown from animal or animal-drawn vehicle in noncollision accident
V80.1|Rider or occupant injured in collision with pedestrian or animal
V80.2|Rider or occupant injured in collision with pedal cycle
V80.3|Rider or occupant injured in collision with two- or three-wheeled motor vehicle
V80.4|Rider or occupant injured in collision with car, pick-up truck, van, heavy transport vehicle or bus
V80.5|Rider or occupant injured in collision with other specified motor vehicle
V80.6|Rider or occupant injured in collision with railway train or railway vehicle
V80.7|Rider or occupant injured in collision with other nonmotor vehicle
V80.8|Rider or occupant injured in collision with fixed or stationary object
V80.9|Rider or occupant injured in other and unspecified transport accidents
V81|Occupant of railway train or railway vehicle injured in transport accident
V81.0|Occupant of railway train or railway vehicle injured in collision with motor vehicle in nontraffic accident
V81.1|Occupant of railway train or railway vehicle injured in collision with motor vehicle in traffic accident
V81.2|Occupant of railway train or railway vehicle injured in collision with or hit by rolling stock
V81.3|Occupant of railway train or railway vehicle injured in collision with other object
V81.4|Person injured while boarding or alighting from railway train or railway vehicle
V81.5|Occupant of railway train or railway vehicle injured by fall in railway train or railway vehicle
V81.6|Occupant of railway train or railway vehicle injured by fall from railway train or railway vehicle
V81.7|Occupant of railway train or railway vehicle injured in derailment without antecedent collision
V81.8|Occupant of railway train or railway vehicle injured in other specified railway accidents
V81.9|Occupant of railway train or railway vehicle injured in unspecified railway accident
V82|Occupant of streetcar injured in transport accident
V82.0|Occupant of streetcar injured in collision with motor vehicle in nontraffic accident
V82.1|Occupant of streetcar injured in collision with motor vehicle in traffic accident
V82.2|Occupant of streetcar injured in collision with or hit by rolling stock
V82.3|Occupant of streetcar injured in collision with other object
V82.4|Person injured while boarding or alighting from streetcar
V82.5|Occupant of streetcar injured by fall in streetcar
V82.6|Occupant of streetcar injured by fall from streetcar
V82.7|Occupant of streetcar injured in derailment without antecedent collision
V82.8|Occupant of streetcar injured in other specified transport accidents
V82.9|Occupant of streetcar injured in unspecified traffic accident
V83|Occupant of special vehicle mainly used on industrial premises injured in transport accident
V83.0|Driver of special industrial vehicle injured in traffic accident
V83.1|Passenger of special industrial vehicle injured in traffic accident
V83.2|Person on outside of special industrial vehicle injured in traffic accident
V83.3|Unspecified occupant of special industrial vehicle injured in traffic accident
V83.4|Person injured while boarding or alighting from special industrial vehicle
V83.5|Driver of special industrial vehicle injured in nontraffic accident
V83.6|Passenger of special industrial vehicle injured in nontraffic accident
V83.7|Person on outside of special industrial vehicle injured in nontraffic accident
V83.9|Unspecified occupant of special industrial vehicle injured in nontraffic accident
V84|Occupant of special vehicle mainly used in agriculture injured in transport accident
V84.0|Driver of special agricultural vehicle injured in traffic accident
V84.1|Passenger of special agricultural vehicle injured in traffic accident
V84.2|Person on outside of special agricultural vehicle injured in traffic accident
V84.3|Unspecified occupant of special agricultural vehicle injured in traffic accident
V84.4|Person injured while boarding or alighting from special agricultural vehicle
V84.5|Driver of special agricultural vehicle injured in nontraffic accident
V84.6|Passenger of special agricultural vehicle injured in nontraffic accident
V84.7|Person on outside of special agricultural vehicle injured in nontraffic accident
V84.9|Unspecified occupant of special agricultural vehicle injured in nontraffic accident
V85|Occupant of special construction vehicle injured in transport accident
V85.0|Driver of special construction vehicle injured in traffic accident
V85.1|Passenger of special construction vehicle injured in traffic accident
V85.2|Person on outside of special construction vehicle injured in traffic accident
V85.3|Unspecified occupant of special construction vehicle injured in traffic accident
V85.4|Person injured while boarding or alighting from special construction vehicle
V85.5|Driver of special construction vehicle injured in nontraffic accident
V85.6|Passenger of special construction vehicle injured in nontraffic accident
V85.7|Person on outside of special construction vehicle injured in nontraffic accident
V85.9|Unspecified occupant of special construction vehicle injured in nontraffic accident
V86|Occupant of special all-terrain or other motor vehicle designed primarily for off-road use, injured in transport accident
V86.0|Driver of all-terrain or other off-road motor vehicle injured in traffic accident
V86.1|Passenger of all-terrain or other off-road motor vehicle injured in traffic accident
V86.2|Person on outside of all-terrain or other off-road motor vehicle injured in traffic accident
V86.3|Unspecified occupant of all-terrain or other off-road motor vehicle injured in traffic accident
V86.4|Person injured while boarding or alighting from all-terrain or other off-road motor vehicle
V86.5|Driver of all-terrain or other off-road motor vehicle injured in nontraffic accident
V86.6|Passenger of all-terrain or other off-road motor vehicle injured in nontraffic accident
V86.7|Person on outside of all-terrain or other off-road motor vehicle injured in nontraffic accident
V86.9|Unspecified occupant of all-terrain or other off-road motor vehicle injured in nontraffic accident
V87|Traffic accident of specified type but victim's mode of transport unknown
V87.0|Person injured in collision between car and two- or three-wheeled motor vehicle (traffic)
V87.1|Person injured in collision between other motor vehicle and two- or three-wheeled motor vehicle (traffic)
V87.2|Person injured in collision between car and pick-up truck or van (traffic)
V87.3|Person injured in collision between car and bus (traffic)
V87.4|Person injured in collision between car and heavy transport vehicle (traffic)
V87.5|Person injured in collision between heavy transport vehicle and bus (traffic)
V87.6|Person injured in collision between railway train or railway vehicle and car (traffic)
V87.7|Person injured in collision between other specified motor vehicles (traffic)
V87.8|Person injured in other specified noncollision transport accidents involving motor vehicle (traffic)
V87.9|Person injured in other specified (collision)(noncollision) transport accidents involving nonmotor vehicle (traffic)
V88|Nontraffic accident of specified type but victim's mode of transport unknown
V88.0|Person injured in collision between car and two- or three-wheeled motor vehicle, nontraffic
V88.1|Person injured in collision between other motor vehicle and two- or three-wheeled motor vehicle, nontraffic
V88.2|Person injured in collision between car and pick-up truck or van, nontraffic
V88.3|Person injured in collision between car and bus, nontraffic
V88.4|Person injured in collision between car and heavy transport vehicle, nontraffic
V88.5|Person injured in collision between heavy transport vehicle and bus, nontraffic
V88.6|Person injured in collision between railway train or railway vehicle and car, nontraffic
V88.7|Person injured in collision between other specified motor vehicles, nontraffic
V88.8|Person injured in other specified noncollision transport accidents involving motor vehicle, nontraffic
V88.9|Person injured in other specified (collision)(noncollision) transport accidents involving nonmotor vehicle, nontraffic
V89|Motor- or nonmotor-vehicle accident, type of vehicle unspecified
V89.0|Person injured in unspecified motor-vehicle accident, nontraffic
V89.1|Person injured in unspecified nonmotor-vehicle accident, nontraffic
V89.2|Person injured in unspecified motor-vehicle accident, traffic
V89.3|Person injured in unspecified nonmotor-vehicle accident, traffic
V89.9|Person injured in unspecified vehicle accident
V90|Accident to watercraft causing drowning and submersion
V90.0|Accident to watercraft causing drowning and submersion: Merchant ship
V90.1|Accident to watercraft causing drowning and submersion: Passenger ship
V90.2|Accident to watercraft causing drowning and submersion: Fishing boat
V90.3|Accident to watercraft causing drowning and submersion: Other powered watercraft
V90.4|Accident to watercraft causing drowning and submersion: Sailboat
V90.5|Accident to watercraft causing drowning and submersion: Canoe or kayak
V90.6|Accident to watercraft causing drowning and submersion: Inflatable craft (nonpowered)
V90.7|Accident to watercraft causing drowning and submersion: Water-skis
V90.8|Accident to watercraft causing drowning and submersion: Other unpowered watercraft
V90.9|Accident to watercraft causing drowning and submersion: Unspecified watercraft
V91|Accident to watercraft causing other injury
V91.0|Accident to watercraft causing other injury: Merchant ship
V91.1|Accident to watercraft causing other injury: Passenger ship
V91.2|Accident to watercraft causing other injury: Fishing boat
V91.3|Accident to watercraft causing other injury: Other powered watercraft
V91.4|Accident to watercraft causing other injury: Sailboat
V91.5|Accident to watercraft causing other injury: Canoe or kayak
V91.6|Accident to watercraft causing other injury: Inflatable craft (nonpowered)
V91.7|Accident to watercraft causing other injury: Water-skis
V91.8|Accident to watercraft causing other injury: Other unpowered watercraft
V91.9|Accident to watercraft causing other injury: Unspecified watercraft
V92|Water-transport-related drowning and submersion without accident to watercraft
V92.0|Water-transport-related drowning and submersion without accident to watercraft: Merchant ship
V92.1|Water-transport-related drowning and submersion without accident to watercraft: Passenger ship
V92.2|Water-transport-related drowning and submersion without accident to watercraft: Fishing boat
V92.3|Water-transport-related drowning and submersion without accident to watercraft: Other powered watercraft
V92.4|Water-transport-related drowning and submersion without accident to watercraft: Sailboat
V92.5|Water-transport-related drowning and submersion without accident to watercraft: Canoe or kayak
V92.6|Water-transport-related drowning and submersion without accident to watercraft: Inflatable craft (nonpowered)
V92.7|Water-transport-related drowning and submersion without accident to watercraft: Water-skis
V92.8|Water-transport-related drowning and submersion without accident to watercraft: Other unpowered watercraft
V92.9|Water-transport-related drowning and submersion without accident to watercraft: Unspecified watercraft
V93|Accident on board watercraft without accident to watercraft, not causing drowning and submersion
V93.0|Accident on board watercraft without accident to watercraft, not causing drowning and submersion: Merchant ship
V93.1|Accident on board watercraft without accident to watercraft, not causing drowning and submersion: Passenger ship
V93.2|Accident on board watercraft without accident to watercraft, not causing drowning and submersion: Fishing boat
V93.3|Accident on board watercraft without accident to watercraft, not causing drowning and submersion: Other powered watercraft
V93.4|Accident on board watercraft without accident to watercraft, not causing drowning and submersion: Sailboat
V93.5|Accident on board watercraft without accident to watercraft, not causing drowning and submersion: Canoe or kayak
V93.6|Accident on board watercraft without accident to watercraft, not causing drowning and submersion: Inflatable craft (nonpowered)
V93.7|Accident on board watercraft without accident to watercraft, not causing drowning and submersion: Water-skis
V93.8|Accident on board watercraft without accident to watercraft, not causing drowning and submersion: Other unpowered watercraft
V93.9|Accident on board watercraft without accident to watercraft, not causing drowning and submersion: Unspecified watercraft
V94|Other and unspecified water transport accidents
V94.0|Other and unspecified water transport accidents: Merchant ship
V94.1|Other and unspecified water transport accidents: Passenger ship
V94.2|Other and unspecified water transport accidents: Fishing boat
V94.3|Other and unspecified water transport accidents: Other powered watercraft
V94.4|Other and unspecified water transport accidents: Sailboat
V94.5|Other and unspecified water transport accidents: Canoe or kayak
V94.6|Other and unspecified water transport accidents: Inflatable craft (nonpowered)
V94.7|Other and unspecified water transport accidents: Water-skis
V94.8|Other and unspecified water transport accidents: Other unpowered watercraft
V94.9|Other and unspecified water transport accidents: Unspecified watercraft
V95|Accident to powered aircraft causing injury to occupant
V95.0|Helicopter accident injuring occupant
V95.1|Ultralight, microlight or powered-glider accident injuring occupant
V95.2|Accident to other private fixed-wing aircraft, injuring occupant
V95.3|Accident to commercial fixed-wing aircraft, injuring occupant
V95.4|Spacecraft accident injuring occupant
V95.8|Other aircraft accidents injuring occupant
V95.9|Unspecified aircraft accident injuring occupant
V96|Accident to nonpowered aircraft causing injury to occupant
V96.0|Balloon accident injuring occupant
V96.1|Hang-glider accident injuring occupant
V96.2|Glider (nonpowered) accident injuring occupant
V96.8|Other nonpowered-aircraft accidents injuring occupant
V96.9|Unspecified nonpowered-aircraft accident injuring occupant
V97|Other specified air transport accidents
V97.0|Occupant of aircraft injured in other specified air transport accidents
V97.1|Person injured while boarding or alighting from aircraft
V97.2|Parachutist injured in air transport accident
V97.3|Person on ground injured in air transport accident
V97.8|Other air transport accidents, not elsewhere classified
V98|Other specified transport accidents
V99|Unspecified transport accident
W00|Fall on same level involving ice and snow
W00.0|Fall on same level involving ice and snow, Home
W00.1|Fall on same level involving ice and snow, Residential Institution
W00.2|Fall on same level involving ice and snow, School, Other Institution and Public Admimistration Area
W00.3|Fall on same level involving ice and snow, Sports and Athletic Areas
W00.4|Fall on same level involving ice and snow, Street and Highway
W00.5|Fall on same level involving ice and snow, Trade and Service Area
W00.6|Fall on same level involving ice and snow, Industrial and Construction Area
W00.7|Fall on same level involving ice and snow, Farm
W00.8|Fall on same level involving ice and snow, Other Specified Area
W00.9|Fall on same level involving ice and snow, Unspecified Place
W01|Fall on same level from slipping, tripping and stumbling
W01.0|Fall on same level from slipping, tripping and stumbling, Home
W01.1|Fall on same level from slipping, tripping and stumbling, Residential Institution
W01.2|Fall on same level from slipping, tripping and stumbling, School, Other Institution and Public Admimistration Area
W01.3|Fall on same level from slipping, tripping and stumbling, Sports and Athletic Areas
W01.4|Fall on same level from slipping, tripping and stumbling, Street and Highway
W01.5|Fall on same level from slipping, tripping and stumbling, Trade and Service Area
W01.6|Fall on same level from slipping, tripping and stumbling, Industrial and Construction Area
W01.7|Fall on same level from slipping, tripping and stumbling, Farm
W01.8|Fall on same level from slipping, tripping and stumbling, Other Specified Area
W01.9|Fall on same level from slipping, tripping and stumbling, Unspecified Place
W02|Fall involving ice-skates, skis, roller-skates or skateboards
W02.0|Fall involving ice-skates, skis, roller-skates or skateboards, Home
W02.1|Fall involving ice-skates, skis, roller-skates or skateboards, Residential Institution
W02.2|Fall involving ice-skates, skis, roller-skates or skateboards, School, Other Institution and Public Admimistration Area
W02.3|Fall involving ice-skates, skis, roller-skates or skateboards, Sports and Athletic Areas
W02.4|Fall involving ice-skates, skis, roller-skates or skateboards, Street and Highway
W02.5|Fall involving ice-skates, skis, roller-skates or skateboards, Trade and Service Area
W02.6|Fall involving ice-skates, skis, roller-skates or skateboards, Industrial and Construction Area
W02.7|Fall involving ice-skates, skis, roller-skates or skateboards, Farm
W02.8|Fall involving ice-skates, skis, roller-skates or skateboards, Other Specified Area
W02.9|Fall involving ice-skates, skis, roller-skates or skateboards, Unspecified Place
W03|Other fall on same level due to collision with, or pushing by, another person
W03.0|Other fall on same level due to collision with, or pushing by, another person, Home
W03.1|Other fall on same level due to collision with, or pushing by, another person, Residential Institution
W03.2|Other fall on same level due to collision with, or pushing by, another person, School, Other Institution and Public Admimistration Area
W03.3|Other fall on same level due to collision with, or pushing by, another person, Sports and Athletic Areas
W03.4|Other fall on same level due to collision with, or pushing by, another person, Street and Highway
W03.5|Other fall on same level due to collision with, or pushing by, another person, Trade and Service Area
W03.6|Other fall on same level due to collision with, or pushing by, another person, Industrial and Construction Area
W03.7|Other fall on same level due to collision with, or pushing by, another person, Farm
W03.8|Other fall on same level due to collision with, or pushing by, another person, Other Specified Area
W03.9|Other fall on same level due to collision with, or pushing by, another person, Unspecified Place
W04|Fall while being carried or supported by other persons
W04.0|Fall while being carried or supported by other persons, Home
W04.1|Fall while being carried or supported by other persons, Residential Institution
W04.2|Fall while being carried or supported by other persons, School, Other Institution and Public Admimistration Area
W04.3|Fall while being carried or supported by other persons, Sports and Athletic Areas
W04.4|Fall while being carried or supported by other persons, Street and Highway
W04.5|Fall while being carried or supported by other persons, Trade and Service Area
W04.6|Fall while being carried or supported by other persons, Industrial and Construction Area
W04.7|Fall while being carried or supported by other persons, Farm
W04.8|Fall while being carried or supported by other persons, Other Specified Area
W04.9|Fall while being carried or supported by other persons, Unspecified Place
W05|Fall involving wheelchair
W05.0|Fall involving wheelchair, Home
W05.1|Fall involving wheelchair, Residential Institution
W05.2|Fall involving wheelchair, School, Other Institution and Public Admimistration Area
W05.3|Fall involving wheelchair, Sports and Athletic Areas
W05.4|Fall involving wheelchair, Street and Highway
W05.5|Fall involving wheelchair, Trade and Service Area
W05.6|Fall involving wheelchair, Industrial and Construction Area
W05.7|Fall involving wheelchair, Farm
W05.8|Fall involving wheelchair, Other Specified Area
W05.9|Fall involving wheelchair, Unspecified Place
W06|Fall involving bed
W06.0|Fall involving bed, Home
W06.1|Fall involving bed, Residential Institution
W06.2|Fall involving bed, School, Other Institution and Public Admimistration Area
W06.3|Fall involving bed, Sports and Athletic Areas
W06.4|Fall involving bed, Street and Highway
W06.5|Fall involving bed, Trade and Service Area
W06.6|Fall involving bed, Industrial and Construction Area
W06.7|Fall involving bed, Farm
W06.8|Fall involving bed, Other Specified Area
W06.9|Fall involving bed, Unspecified Place
W07|Fall involving chair
W07.0|Fall involving chair, Home
W07.1|Fall involving chair, Residential Institution
W07.2|Fall involving chair, School, Other Institution and Public Admimistration Area
W07.3|Fall involving chair, Sports and Athletic Areas
W07.4|Fall involving chair, Street and Highway
W07.5|Fall involving chair, Trade and Service Area
W07.6|Fall involving chair, Industrial and Construction Area
W07.7|Fall involving chair, Farm
W07.8|Fall involving chair, Other Specified Area
W07.9|Fall involving chair, Unspecified Place
W08|Fall involving other furniture
W08.0|Fall involving other furniture, Home
W08.1|Fall involving other furniture, Residential Institution
W08.2|Fall involving other furniture, School, Other Institution and Public Admimistration Area
W08.3|Fall involving other furniture, Sports and Athletic Areas
W08.4|Fall involving other furniture, Street and Highway
W08.5|Fall involving other furniture, Trade and Service Area
W08.6|Fall involving other furniture, Industrial and Construction Area
W08.7|Fall involving other furniture, Farm
W08.8|Fall involving other furniture, Other Specified Area
W08.9|Fall involving other furniture, Unspecified Place
W09|Fall involving playground equipment
W09.0|Fall involving playground equipment, Home
W09.1|Fall involving playground equipment, Residential Institution
W09.2|Fall involving playground equipment, School, Other Institution and Public Admimistration Area
W09.3|Fall involving playground equipment, Sports and Athletic Areas
W09.4|Fall involving playground equipment, Street and Highway
W09.5|Fall involving playground equipment, Trade and Service Area
W09.6|Fall involving playground equipment, Industrial and Construction Area
W09.7|Fall involving playground equipment, Farm
W09.8|Fall involving playground equipment, Other Specified Area
W09.9|Fall involving playground equipment, Unspecified Place
W10|Fall on and from stairs and steps
W10.0|Fall on and from stairs and steps, Home
W10.1|Fall on and from stairs and steps, Residential Institution
W10.2|Fall on and from stairs and steps, School, Other Institution and Public Admimistration Area
W10.3|Fall on and from stairs and steps, Sports and Athletic Areas
W10.4|Fall on and from stairs and steps, Street and Highway
W10.5|Fall on and from stairs and steps, Trade and Service Area
W10.6|Fall on and from stairs and steps, Industrial and Construction Area
W10.7|Fall on and from stairs and steps, Farm
W10.8|Fall on and from stairs and steps, Other Specified Area
W10.9|Fall on and from stairs and steps, Unspecified Place
W11|Fall on and from ladder
W11.0|Fall on and from ladder, Home
W11.1|Fall on and from ladder, Residential Institution
W11.2|Fall on and from ladder, School, Other Institution and Public Admimistration Area
W11.3|Fall on and from ladder, Sports and Athletic Areas
W11.4|Fall on and from ladder, Street and Highway
W11.5|Fall on and from ladder, Trade and Service Area
W11.6|Fall on and from ladder, Industrial and Construction Area
W11.7|Fall on and from ladder, Farm
W11.8|Fall on and from ladder, Other Specified Area
W11.9|Fall on and from ladder, Unspecified Place
W12|Fall on and from scaffolding
W12.0|Fall on and from scaffolding, Home
W12.1|Fall on and from scaffolding, Residential Institution
W12.2|Fall on and from scaffolding, School, Other Institution and Public Admimistration Area
W12.3|Fall on and from scaffolding, Sports and Athletic Areas
W12.4|Fall on and from scaffolding, Street and Highway
W12.5|Fall on and from scaffolding, Trade and Service Area
W12.6|Fall on and from scaffolding, Industrial and Construction Area
W12.7|Fall on and from scaffolding, Farm
W12.8|Fall on and from scaffolding, Other Specified Area
W12.9|Fall on and from scaffolding, Unspecified Place
W13|Fall from, out of or through building or structure
W13.0|Fall from, out of or through building or structure, Home
W13.1|Fall from, out of or through building or structure, Residential Institution
W13.2|Fall from, out of or through building or structure, School, Other Institution and Public Admimistration Area
W13.3|Fall from, out of or through building or structure, Sports and Athletic Areas
W13.4|Fall from, out of or through building or structure, Street and Highway
W13.5|Fall from, out of or through building or structure, Trade and Service Area
W13.6|Fall from, out of or through building or structure, Industrial and Construction Area
W13.7|Fall from, out of or through building or structure, Farm
W13.8|Fall from, out of or through building or structure, Other Specified Area
W13.9|Fall from, out of or through building or structure, Unspecified Place
W14|Fall from tree
W14.0|Fall from tree, Home
W14.1|Fall from tree, Residential Institution
W14.2|Fall from tree, School, Other Institution and Public Admimistration Area
W14.3|Fall from tree, Sports and Athletic Areas
W14.4|Fall from tree, Street and Highway
W14.5|Fall from tree, Trade and Service Area
W14.6|Fall from tree, Industrial and Construction Area
W14.7|Fall from tree, Farm
W14.8|Fall from tree, Other Specified Area
W14.9|Fall from tree, Unspecified Place
W15|Fall from cliff
W15.0|Fall from cliff, Home
W15.1|Fall from cliff, Residential Institution
W15.2|Fall from cliff, School, Other Institution and Public Admimistration Area
W15.3|Fall from cliff, Sports and Athletic Areas
W15.4|Fall from cliff, Street and Highway
W15.5|Fall from cliff, Trade and Service Area
W15.6|Fall from cliff, Industrial and Construction Area
W15.7|Fall from cliff, Farm
W15.8|Fall from cliff, Other Specified Area
W15.9|Fall from cliff, Unspecified Place
W16|Diving or jumping into water causing injury other than drowning or submersion
W16.0|Diving or jumping into water causing injury other than drowning or submersion, Home
W16.1|Diving or jumping into water causing injury other than drowning or submersion, Residential Institution
W16.2|Diving or jumping into water causing injury other than drowning or submersion, School, Other Institution and Public Admimistration Area
W16.3|Diving or jumping into water causing injury other than drowning or submersion, Sports and Athletic Areas
W16.4|Diving or jumping into water causing injury other than drowning or submersion, Street and Highway
W16.5|Diving or jumping into water causing injury other than drowning or submersion, Trade and Service Area
W16.6|Diving or jumping into water causing injury other than drowning or submersion, Industrial and Construction Area
W16.7|Diving or jumping into water causing injury other than drowning or submersion, Farm
W16.8|Diving or jumping into water causing injury other than drowning or submersion, Other Specified Area
W16.9|Diving or jumping into water causing injury other than drowning or submersion, Unspecified Place
W17|Other fall from one level to another
W17.0|Other fall from one level to another, Home
W17.1|Other fall from one level to another, Residential Institution
W17.2|Other fall from one level to another, School, Other Institution and Public Admimistration Area
W17.3|Other fall from one level to another, Sports and Athletic Areas
W17.4|Other fall from one level to another, Street and Highway
W17.5|Other fall from one level to another, Trade and Service Area
W17.6|Other fall from one level to another, Industrial and Construction Area
W17.7|Other fall from one level to another, Farm
W17.8|Other fall from one level to another, Other Specified Area
W17.9|Other fall from one level to another, Unspecified Place
W18|Other fall on same level
W18.0|Other fall on same level, Home
W18.1|Other fall on same level, Residential Institution
W18.2|Other fall on same level, School, Other Institution and Public Admimistration Area
W18.3|Other fall on same level, Sports and Athletic Areas
W18.4|Other fall on same level, Street and Highway
W18.5|Other fall on same level, Trade and Service Area
W18.6|Other fall on same level, Industrial and Construction Area
W18.7|Other fall on same level, Farm
W18.8|Other fall on same level, Other Specified Area
W18.9|Other fall on same level, Unspecified Place
W19|Unspecified fall
W19.0|Unspecified fall, Home
W19.1|Unspecified fall, Residential Institution
W19.2|Unspecified fall, School, Other Institution and Public Admimistration Area
W19.3|Unspecified fall, Sports and Athletic Areas
W19.4|Unspecified fall, Street and Highway
W19.5|Unspecified fall, Trade and Service Area
W19.6|Unspecified fall, Industrial and Construction Area
W19.7|Unspecified fall, Farm
W19.8|Unspecified fall, Other Specified Area
W19.9|Unspecified fall, Unspecified Place
W20|Struck by thrown, projected or falling object
W20.0|Struck by thrown, projected or falling object, Home
W20.1|Struck by thrown, projected or falling object, Residential Institution
W20.2|Struck by thrown, projected or falling object, School, Other Institution and Public Admimistration Area
W20.3|Struck by thrown, projected or falling object, Sports and Athletic Areas
W20.4|Struck by thrown, projected or falling object, Street and Highway
W20.5|Struck by thrown, projected or falling object, Trade and Service Area
W20.6|Struck by thrown, projected or falling object, Industrial and Construction Area
W20.7|Struck by thrown, projected or falling object, Farm
W20.8|Struck by thrown, projected or falling object, Other Specified Area
W20.9|Struck by thrown, projected or falling object, Unspecified Place
W21|Striking against or struck by sports equipment
W21.0|Striking against or struck by sports equipment, Home
W21.1|Striking against or struck by sports equipment, Residential Institution
W21.2|Striking against or struck by sports equipment, School, Other Institution and Public Admimistration Area
W21.3|Striking against or struck by sports equipment, Sports and Athletic Areas
W21.4|Striking against or struck by sports equipment, Street and Highway
W21.5|Striking against or struck by sports equipment, Trade and Service Area
W21.6|Striking against or struck by sports equipment, Industrial and Construction Area
W21.7|Striking against or struck by sports equipment, Farm
W21.8|Striking against or struck by sports equipment, Other Specified Area
W21.9|Striking against or struck by sports equipment, Unspecified Place
W22|Striking against or struck by other objects
W22.0|Striking against or struck by other objects, Home
W22.1|Striking against or struck by other objects, Residential Institution
W22.2|Striking against or struck by other objects, School, Other Institution and Public Admimistration Area
W22.3|Striking against or struck by other objects, Sports and Athletic Areas
W22.4|Striking against or struck by other objects, Street and Highway
W22.5|Striking against or struck by other objects, Trade and Service Area
W22.6|Striking against or struck by other objects, Industrial and Construction Area
W22.7|Striking against or struck by other objects, Farm
W22.8|Striking against or struck by other objects, Other Specified Area
W22.9|Striking against or struck by other objects, Unspecified Place
W23|Caught, crushed, jammed or pinched in or between objects
W23.0|Caught, crushed, jammed or pinched in or between objects, Home
W23.1|Caught, crushed, jammed or pinched in or between objects, Residential Institution
W23.2|Caught, crushed, jammed or pinched in or between objects, School, Other Institution and Public Admimistration Area
W23.3|Caught, crushed, jammed or pinched in or between objects, Sports and Athletic Areas
W23.4|Caught, crushed, jammed or pinched in or between objects, Street and Highway
W23.5|Caught, crushed, jammed or pinched in or between objects, Trade and Service Area
W23.6|Caught, crushed, jammed or pinched in or between objects, Industrial and Construction Area
W23.7|Caught, crushed, jammed or pinched in or between objects, Farm
W23.8|Caught, crushed, jammed or pinched in or between objects, Other Specified Area
W23.9|Caught, crushed, jammed or pinched in or between objects, Unspecified Place
W24|Contact with lifting and transmission devices, not elsewhere classified
W24.0|Contact with lifting and transmission devices, not elsewhere classified, Home
W24.1|Contact with lifting and transmission devices, not elsewhere classified, Residential Institution
W24.2|Contact with lifting and transmission devices, not elsewhere classified, School, Other Institution and Public Admimistration Area
W24.3|Contact with lifting and transmission devices, not elsewhere classified, Sports and Athletic Areas
W24.4|Contact with lifting and transmission devices, not elsewhere classified, Street and Highway
W24.5|Contact with lifting and transmission devices, not elsewhere classified, Trade and Service Area
W24.6|Contact with lifting and transmission devices, not elsewhere classified, Industrial and Construction Area
W24.7|Contact with lifting and transmission devices, not elsewhere classified, Farm
W24.8|Contact with lifting and transmission devices, not elsewhere classified, Other Specified Area
W24.9|Contact with lifting and transmission devices, not elsewhere classified, Unspecified Place
W25|Contact with sharp glass
W25.0|Contact with sharp glass, Home
W25.1|Contact with sharp glass, Residential Institution
W25.2|Contact with sharp glass, School, Other Institution and Public Admimistration Area
W25.3|Contact with sharp glass, Sports and Athletic Areas
W25.4|Contact with sharp glass, Street and Highway
W25.5|Contact with sharp glass, Trade and Service Area
W25.6|Contact with sharp glass, Industrial and Construction Area
W25.7|Contact with sharp glass, Farm
W25.8|Contact with sharp glass, Other Specified Area
W25.9|Contact with sharp glass, Unspecified Place
W26|Contact with knife, sword or dagger
W26.0|Contact with knife, sword or dagger, Home
W26.1|Contact with knife, sword or dagger, Residential Institution
W26.2|Contact with knife, sword or dagger, School, Other Institution and Public Admimistration Area
W26.3|Contact with knife, sword or dagger, Sports and Athletic Areas
W26.4|Contact with knife, sword or dagger, Street and Highway
W26.5|Contact with knife, sword or dagger, Trade and Service Area
W26.6|Contact with knife, sword or dagger, Industrial and Construction Area
W26.7|Contact with knife, sword or dagger, Farm
W26.8|Contact with knife, sword or dagger, Other Specified Area
W26.9|Contact with knife, sword or dagger, Unspecified Place
W27|Contact with nonpowered hand tool
W27.0|Contact with nonpowered hand tool, Home
W27.1|Contact with nonpowered hand tool, Residential Institution
W27.2|Contact with nonpowered hand tool, School, Other Institution and Public Admimistration Area
W27.3|Contact with nonpowered hand tool, Sports and Athletic Areas
W27.4|Contact with nonpowered hand tool, Street and Highway
W27.5|Contact with nonpowered hand tool, Trade and Service Area
W27.6|Contact with nonpowered hand tool, Industrial and Construction Area
W27.7|Contact with nonpowered hand tool, Farm
W27.8|Contact with nonpowered hand tool, Other Specified Area
W27.9|Contact with nonpowered hand tool, Unspecified Place
W28|Contact with powered lawnmower
W28.0|Contact with powered lawnmower, Home
W28.1|Contact with powered lawnmower, Residential Institution
W28.2|Contact with powered lawnmower, School, Other Institution and Public Admimistration Area
W28.3|Contact with powered lawnmower, Sports and Athletic Areas
W28.4|Contact with powered lawnmower, Street and Highway
W28.5|Contact with powered lawnmower, Trade and Service Area
W28.6|Contact with powered lawnmower, Industrial and Construction Area
W28.7|Contact with powered lawnmower, Farm
W28.8|Contact with powered lawnmower, Other Specified Area
W28.9|Contact with powered lawnmower, Unspecified Place
W29|Contact with other powered hand tools and household machinery
W29.0|Contact with other powered hand tools and household machinery, Home
W29.1|Contact with other powered hand tools and household machinery, Residential Institution
W29.2|Contact with other powered hand tools and household machinery, School, Other Institution and Public Admimistration Area
W29.3|Contact with other powered hand tools and household machinery, Sports and Athletic Areas
W29.4|Contact with other powered hand tools and household machinery, Street and Highway
W29.5|Contact with other powered hand tools and household machinery, Trade and Service Area
W29.6|Contact with other powered hand tools and household machinery, Industrial and Construction Area
W29.7|Contact with other powered hand tools and household machinery, Farm
W29.8|Contact with other powered hand tools and household machinery, Other Specified Area
W29.9|Contact with other powered hand tools and household machinery, Unspecified Place
W30|Contact with agricultural machinery
W30.0|Contact with agricultural machinery, Home
W30.1|Contact with agricultural machinery, Residential Institution
W30.2|Contact with agricultural machinery, School, Other Institution and Public Admimistration Area
W30.3|Contact with agricultural machinery, Sports and Athletic Areas
W30.4|Contact with agricultural machinery, Street and Highway
W30.5|Contact with agricultural machinery, Trade and Service Area
W30.6|Contact with agricultural machinery, Industrial and Construction Area
W30.7|Contact with agricultural machinery, Farm
W30.8|Contact with agricultural machinery, Other Specified Area
W30.9|Contact with agricultural machinery, Unspecified Place
W31|Contact with other and unspecified machinery
W31.0|Contact with other and unspecified machinery, Home
W31.1|Contact with other and unspecified machinery, Residential Institution
W31.2|Contact with other and unspecified machinery, School, Other Institution and Public Admimistration Area
W31.3|Contact with other and unspecified machinery, Sports and Athletic Areas
W31.4|Contact with other and unspecified machinery, Street and Highway
W31.5|Contact with other and unspecified machinery, Trade and Service Area
W31.6|Contact with other and unspecified machinery, Industrial and Construction Area
W31.7|Contact with other and unspecified machinery, Farm
W31.8|Contact with other and unspecified machinery, Other Specified Area
W31.9|Contact with other and unspecified machinery, Unspecified Place
W32|Handgun discharge
W32.0|Handgun discharge, Home
W32.1|Handgun discharge, Residential Institution
W32.2|Handgun discharge, School, Other Institution and Public Admimistration Area
W32.3|Handgun discharge, Sports and Athletic Areas
W32.4|Handgun discharge, Street and Highway
W32.5|Handgun discharge, Trade and Service Area
W32.6|Handgun discharge, Industrial and Construction Area
W32.7|Handgun discharge, Farm
W32.8|Handgun discharge, Other Specified Area
W32.9|Handgun discharge, Unspecified Place
W33|Rifle, shotgun and larger firearm discharge
W33.0|Rifle, shotgun and larger firearm discharge, Home
W33.1|Rifle, shotgun and larger firearm discharge, Residential Institution
W33.2|Rifle, shotgun and larger firearm discharge, School, Other Institution and Public Admimistration Area
W33.3|Rifle, shotgun and larger firearm discharge, Sports and Athletic Areas
W33.4|Rifle, shotgun and larger firearm discharge, Street and Highway
W33.5|Rifle, shotgun and larger firearm discharge, Trade and Service Area
W33.6|Rifle, shotgun and larger firearm discharge, Industrial and Construction Area
W33.7|Rifle, shotgun and larger firearm discharge, Farm
W33.8|Rifle, shotgun and larger firearm discharge, Other Specified Area
W33.9|Rifle, shotgun and larger firearm discharge, Unspecified Place
W34|Discharge from other and unspecified firearms
W34.0|Discharge from other and unspecified firearms, Home
W34.1|Discharge from other and unspecified firearms, Residential Institution
W34.2|Discharge from other and unspecified firearms, School, Other Institution and Public Admimistration Area
W34.3|Discharge from other and unspecified firearms, Sports and Athletic Areas
W34.4|Discharge from other and unspecified firearms, Street and Highway
W34.5|Discharge from other and unspecified firearms, Trade and Service Area
W34.6|Discharge from other and unspecified firearms, Industrial and Construction Area
W34.7|Discharge from other and unspecified firearms, Farm
W34.8|Discharge from other and unspecified firearms, Other Specified Area
W34.9|Discharge from other and unspecified firearms, Unspecified Place
W35|Explosion and rupture of boiler
W35.0|Explosion and rupture of boiler, Home
W35.1|Explosion and rupture of boiler, Residential Institution
W35.2|Explosion and rupture of boiler, School, Other Institution and Public Admimistration Area
W35.3|Explosion and rupture of boiler, Sports and Athletic Areas
W35.4|Explosion and rupture of boiler, Street and Highway
W35.5|Explosion and rupture of boiler, Trade and Service Area
W35.6|Explosion and rupture of boiler, Industrial and Construction Area
W35.7|Explosion and rupture of boiler, Farm
W35.8|Explosion and rupture of boiler, Other Specified Area
W35.9|Explosion and rupture of boiler, Unspecified Place
W36|Explosion and rupture of gas cylinder
W36.0|Explosion and rupture of gas cylinder, Home
W36.1|Explosion and rupture of gas cylinder, Residential Institution
W36.2|Explosion and rupture of gas cylinder, School, Other Institution and Public Admimistration Area
W36.3|Explosion and rupture of gas cylinder, Sports and Athletic Areas
W36.4|Explosion and rupture of gas cylinder, Street and Highway
W36.5|Explosion and rupture of gas cylinder, Trade and Service Area
W36.6|Explosion and rupture of gas cylinder, Industrial and Construction Area
W36.7|Explosion and rupture of gas cylinder, Farm
W36.8|Explosion and rupture of gas cylinder, Other Specified Area
W36.9|Explosion and rupture of gas cylinder, Unspecified Place
W37|Explosion and rupture of pressurized tyre, pipe or hose
W37.0|Explosion and rupture of pressurized tyre, pipe or hose, Home
W37.1|Explosion and rupture of pressurized tyre, pipe or hose, Residential Institution
W37.2|Explosion and rupture of pressurized tyre, pipe or hose, School, Other Institution and Public Admimistration Area
W37.3|Explosion and rupture of pressurized tyre, pipe or hose, Sports and Athletic Areas
W37.4|Explosion and rupture of pressurized tyre, pipe or hose, Street and Highway
W37.5|Explosion and rupture of pressurized tyre, pipe or hose, Trade and Service Area
W37.6|Explosion and rupture of pressurized tyre, pipe or hose, Industrial and Construction Area
W37.7|Explosion and rupture of pressurized tyre, pipe or hose, Farm
W37.8|Explosion and rupture of pressurized tyre, pipe or hose, Other Specified Area
W37.9|Explosion and rupture of pressurized tyre, pipe or hose, Unspecified Place
W38|Explosion and rupture of other specified pressurized devices
W38.0|Explosion and rupture of other specified pressurized devices, Home
W38.1|Explosion and rupture of other specified pressurized devices, Residential Institution
W38.2|Explosion and rupture of other specified pressurized devices, School, Other Institution and Public Admimistration Area
W38.3|Explosion and rupture of other specified pressurized devices, Sports and Athletic Areas
W38.4|Explosion and rupture of other specified pressurized devices, Street and Highway
W38.5|Explosion and rupture of other specified pressurized devices, Trade and Service Area
W38.6|Explosion and rupture of other specified pressurized devices, Industrial and Construction Area
W38.7|Explosion and rupture of other specified pressurized devices, Farm
W38.8|Explosion and rupture of other specified pressurized devices, Other Specified Area
W38.9|Explosion and rupture of other specified pressurized devices, Unspecified Place
W39|Discharge of firework
W39.0|Discharge of firework, Home
W39.1|Discharge of firework, Residential Institution
W39.2|Discharge of firework, School, Other Institution and Public Admimistration Area
W39.3|Discharge of firework, Sports and Athletic Areas
W39.4|Discharge of firework, Street and Highway
W39.5|Discharge of firework, Trade and Service Area
W39.6|Discharge of firework, Industrial and Construction Area
W39.7|Discharge of firework, Farm
W39.8|Discharge of firework, Other Specified Area
W39.9|Discharge of firework, Unspecified Place
W40|Explosion of other materials
W40.0|Explosion of other materials, Home
W40.1|Explosion of other materials, Residential Institution
W40.2|Explosion of other materials, School, Other Institution and Public Admimistration Area
W40.3|Explosion of other materials, Sports and Athletic Areas
W40.4|Explosion of other materials, Street and Highway
W40.5|Explosion of other materials, Trade and Service Area
W40.6|Explosion of other materials, Industrial and Construction Area
W40.7|Explosion of other materials, Farm
W40.8|Explosion of other materials, Other Specified Area
W40.9|Explosion of other materials, Unspecified Place
W41|Exposure to high-pressure jet
W41.0|Exposure to high-pressure jet, Home
W41.1|Exposure to high-pressure jet, Residential Institution
W41.2|Exposure to high-pressure jet, School, Other Institution and Public Admimistration Area
W41.3|Exposure to high-pressure jet, Sports and Athletic Areas
W41.4|Exposure to high-pressure jet, Street and Highway
W41.5|Exposure to high-pressure jet, Trade and Service Area
W41.6|Exposure to high-pressure jet, Industrial and Construction Area
W41.7|Exposure to high-pressure jet, Farm
W41.8|Exposure to high-pressure jet, Other Specified Area
W41.9|Exposure to high-pressure jet, Unspecified Place
W42|Exposure to noise
W42.0|Exposure to noise, Home
W42.1|Exposure to noise, Residential Institution
W42.2|Exposure to noise, School, Other Institution and Public Admimistration Area
W42.3|Exposure to noise, Sports and Athletic Areas
W42.4|Exposure to noise, Street and Highway
W42.5|Exposure to noise, Trade and Service Area
W42.6|Exposure to noise, Industrial and Construction Area
W42.7|Exposure to noise, Farm
W42.8|Exposure to noise, Other Specified Area
W42.9|Exposure to noise, Unspecified Place
W43|Exposure to vibration
W43.0|Exposure to vibration, Home
W43.1|Exposure to vibration, Residential Institution
W43.2|Exposure to vibration, School, Other Institution and Public Admimistration Area
W43.3|Exposure to vibration, Sports and Athletic Areas
W43.4|Exposure to vibration, Street and Highway
W43.5|Exposure to vibration, Trade and Service Area
W43.6|Exposure to vibration, Industrial and Construction Area
W43.7|Exposure to vibration, Farm
W43.8|Exposure to vibration, Other Specified Area
W43.9|Exposure to vibration, Unspecified Place
W44|Foreign body entering into or through eye or natural orifice
W44.0|Foreign body entering into or through eye or natural orifice, Home
W44.1|Foreign body entering into or through eye or natural orifice, Residential Institution
W44.2|Foreign body entering into or through eye or natural orifice, School, Other Institution and Public Admimistration Area
W44.3|Foreign body entering into or through eye or natural orifice, Sports and Athletic Areas
W44.4|Foreign body entering into or through eye or natural orifice, Street and Highway
W44.5|Foreign body entering into or through eye or natural orifice, Trade and Service Area
W44.6|Foreign body entering into or through eye or natural orifice, Industrial and Construction Area
W44.7|Foreign body entering into or through eye or natural orifice, Farm
W44.8|Foreign body entering into or through eye or natural orifice, Other Specified Area
W44.9|Foreign body entering into or through eye or natural orifice, Unspecified Place
W45|Foreign body or object entering through skin
W45.0|Foreign body or object entering through skin, Home
W45.1|Foreign body or object entering through skin, Residential Institution
W45.2|Foreign body or object entering through skin, School, Other Institution and Public Admimistration Area
W45.3|Foreign body or object entering through skin, Sports and Athletic Areas
W45.4|Foreign body or object entering through skin, Street and Highway
W45.5|Foreign body or object entering through skin, Trade and Service Area
W45.6|Foreign body or object entering through skin, Industrial and Construction Area
W45.7|Foreign body or object entering through skin, Farm
W45.8|Foreign body or object entering through skin, Other Specified Area
W45.9|Foreign body or object entering through skin, Unspecified Place
W46|Contact with hypodermic needle
W46.0|Contact with hypodermic needle, Home
W46.1|Contact with hypodermic needle, Residential Institution
W46.2|Contact with hypodermic needle, School, Other Institution and Public Admimistration Area
W46.3|Contact with hypodermic needle, Sports and Athletic Areas
W46.4|Contact with hypodermic needle, Street and Highway
W46.5|Contact with hypodermic needle, Trade and Service Area
W46.6|Contact with hypodermic needle, Industrial and Construction Area
W46.7|Contact with hypodermic needle, Farm
W46.8|Contact with hypodermic needle, Other Specified Area
W46.9|Contact with hypodermic needle, Unspecified Place
W49|Exposure to other and unspecified inanimate mechanical forces
W49.0|Exposure to other and unspecified inanimate mechanical forces, Home
W49.1|Exposure to other and unspecified inanimate mechanical forces, Residential Institution
W49.2|Exposure to other and unspecified inanimate mechanical forces, School, Other Institution and Public Admimistration Area
W49.3|Exposure to other and unspecified inanimate mechanical forces, Sports and Athletic Areas
W49.4|Exposure to other and unspecified inanimate mechanical forces, Street and Highway
W49.5|Exposure to other and unspecified inanimate mechanical forces, Trade and Service Area
W49.6|Exposure to other and unspecified inanimate mechanical forces, Industrial and Construction Area
W49.7|Exposure to other and unspecified inanimate mechanical forces, Farm
W49.8|Exposure to other and unspecified inanimate mechanical forces, Other Specified Area
W49.9|Exposure to other and unspecified inanimate mechanical forces, Unspecified Place
W50|Hit, struck, kicked, twisted, bitten or scratched by another person
W50.0|Hit, struck, kicked, twisted, bitten or scratched by another person, Home
W50.1|Hit, struck, kicked, twisted, bitten or scratched by another person, Residential Institution
W50.2|Hit, struck, kicked, twisted, bitten or scratched by another person, School, Other Institution and Public Admimistration Area
W50.3|Hit, struck, kicked, twisted, bitten or scratched by another person, Sports and Athletic Areas
W50.4|Hit, struck, kicked, twisted, bitten or scratched by another person, Street and Highway
W50.5|Hit, struck, kicked, twisted, bitten or scratched by another person, Trade and Service Area
W50.6|Hit, struck, kicked, twisted, bitten or scratched by another person, Industrial and Construction Area
W50.7|Hit, struck, kicked, twisted, bitten or scratched by another person, Farm
W50.8|Hit, struck, kicked, twisted, bitten or scratched by another person, Other Specified Area
W50.9|Hit, struck, kicked, twisted, bitten or scratched by another person, Unspecified Place
W51|Striking against or bumped into by another person
W51.0|Striking against or bumped into by another person, Home
W51.1|Striking against or bumped into by another person, Residential Institution
W51.2|Striking against or bumped into by another person, School, Other Institution and Public Admimistration Area
W51.3|Striking against or bumped into by another person, Sports and Athletic Areas
W51.4|Striking against or bumped into by another person, Street and Highway
W51.5|Striking against or bumped into by another person, Trade and Service Area
W51.6|Striking against or bumped into by another person, Industrial and Construction Area
W51.7|Striking against or bumped into by another person, Farm
W51.8|Striking against or bumped into by another person, Other Specified Area
W51.9|Striking against or bumped into by another person, Unspecified Place
W52|Crushed, pushed or stepped on by crowd or human stampede
W52.0|Crushed, pushed or stepped on by crowd or human stampede, Home
W52.1|Crushed, pushed or stepped on by crowd or human stampede, Residential Institution
W52.2|Crushed, pushed or stepped on by crowd or human stampede, School, Other Institution and Public Admimistration Area
W52.3|Crushed, pushed or stepped on by crowd or human stampede, Sports and Athletic Areas
W52.4|Crushed, pushed or stepped on by crowd or human stampede, Street and Highway
W52.5|Crushed, pushed or stepped on by crowd or human stampede, Trade and Service Area
W52.6|Crushed, pushed or stepped on by crowd or human stampede, Industrial and Construction Area
W52.7|Crushed, pushed or stepped on by crowd or human stampede, Farm
W52.8|Crushed, pushed or stepped on by crowd or human stampede, Other Specified Area
W52.9|Crushed, pushed or stepped on by crowd or human stampede, Unspecified Place
W53|Bitten by rat
W53.0|Bitten by rat, Home
W53.1|Bitten by rat, Residential Institution
W53.2|Bitten by rat, School, Other Institution and Public Admimistration Area
W53.3|Bitten by rat, Sports and Athletic Areas
W53.4|Bitten by rat, Street and Highway
W53.5|Bitten by rat, Trade and Service Area
W53.6|Bitten by rat, Industrial and Construction Area
W53.7|Bitten by rat, Farm
W53.8|Bitten by rat, Other Specified Area
W53.9|Bitten by rat, Unspecified Place
W54|Bitten or struck by dog
W54.0|Bitten or struck by dog, Home
W54.1|Bitten or struck by dog, Residential Institution
W54.2|Bitten or struck by dog, School, Other Institution and Public Admimistration Area
W54.3|Bitten or struck by dog, Sports and Athletic Areas
W54.4|Bitten or struck by dog, Street and Highway
W54.5|Bitten or struck by dog, Trade and Service Area
W54.6|Bitten or struck by dog, Industrial and Construction Area
W54.7|Bitten or struck by dog, Farm
W54.8|Bitten or struck by dog, Other Specified Area
W54.9|Bitten or struck by dog, Unspecified Place
W55|Bitten or struck by other mammals
W55.0|Bitten or struck by other mammals, Home
W55.1|Bitten or struck by other mammals, Residential Institution
W55.2|Bitten or struck by other mammals, School, Other Institution and Public Admimistration Area
W55.3|Bitten or struck by other mammals, Sports and Athletic Areas
W55.4|Bitten or struck by other mammals, Street and Highway
W55.5|Bitten or struck by other mammals, Trade and Service Area
W55.6|Bitten or struck by other mammals, Industrial and Construction Area
W55.7|Bitten or struck by other mammals, Farm
W55.8|Bitten or struck by other mammals, Other Specified Area
W55.9|Bitten or struck by other mammals, Unspecified Place
W56|Contact with marine animal
W56.0|Contact with marine animal, Home
W56.1|Contact with marine animal, Residential Institution
W56.2|Contact with marine animal, School, Other Institution and Public Admimistration Area
W56.3|Contact with marine animal, Sports and Athletic Areas
W56.4|Contact with marine animal, Street and Highway
W56.5|Contact with marine animal, Trade and Service Area
W56.6|Contact with marine animal, Industrial and Construction Area
W56.7|Contact with marine animal, Farm
W56.8|Contact with marine animal, Other Specified Area
W56.9|Contact with marine animal, Unspecified Place
W57|Bitten or stung by nonvenomous insect and other nonvenomous arthropods
W57.0|Bitten or stung by nonvenomous insect and other nonvenomous arthropods, Home
W57.1|Bitten or stung by nonvenomous insect and other nonvenomous arthropods, Residential Institution
W57.2|Bitten or stung by nonvenomous insect and other nonvenomous arthropods, School, Other Institution and Public Admimistration Area
W57.3|Bitten or stung by nonvenomous insect and other nonvenomous arthropods, Sports and Athletic Areas
W57.4|Bitten or stung by nonvenomous insect and other nonvenomous arthropods, Street and Highway
W57.5|Bitten or stung by nonvenomous insect and other nonvenomous arthropods, Trade and Service Area
W57.6|Bitten or stung by nonvenomous insect and other nonvenomous arthropods, Industrial and Construction Area
W57.7|Bitten or stung by nonvenomous insect and other nonvenomous arthropods, Farm
W57.8|Bitten or stung by nonvenomous insect and other nonvenomous arthropods, Other Specified Area
W57.9|Bitten or stung by nonvenomous insect and other nonvenomous arthropods, Unspecified Place
W58|Bitten or struck by crocodile or alligator
W58.0|Bitten or struck by crocodile or alligator, Home
W58.1|Bitten or struck by crocodile or alligator, Residential Institution
W58.2|Bitten or struck by crocodile or alligator, School, Other Institution and Public Admimistration Area
W58.3|Bitten or struck by crocodile or alligator, Sports and Athletic Areas
W58.4|Bitten or struck by crocodile or alligator, Street and Highway
W58.5|Bitten or struck by crocodile or alligator, Trade and Service Area
W58.6|Bitten or struck by crocodile or alligator, Industrial and Construction Area
W58.7|Bitten or struck by crocodile or alligator, Farm
W58.8|Bitten or struck by crocodile or alligator, Other Specified Area
W58.9|Bitten or struck by crocodile or alligator, Unspecified Place
W59|Bitten or crushed by other reptiles
W59.0|Bitten or crushed by other reptiles, Home
W59.1|Bitten or crushed by other reptiles, Residential Institution
W59.2|Bitten or crushed by other reptiles, School, Other Institution and Public Admimistration Area
W59.3|Bitten or crushed by other reptiles, Sports and Athletic Areas
W59.4|Bitten or crushed by other reptiles, Street and Highway
W59.5|Bitten or crushed by other reptiles, Trade and Service Area
W59.6|Bitten or crushed by other reptiles, Industrial and Construction Area
W59.7|Bitten or crushed by other reptiles, Farm
W59.8|Bitten or crushed by other reptiles, Other Specified Area
W59.9|Bitten or crushed by other reptiles, Unspecified Place
W60|Contact with plant thorns and spines and sharp leaves
W60.0|Contact with plant thorns and spines and sharp leaves, Home
W60.1|Contact with plant thorns and spines and sharp leaves, Residential Institution
W60.2|Contact with plant thorns and spines and sharp leaves, School, Other Institution and Public Admimistration Area
W60.3|Contact with plant thorns and spines and sharp leaves, Sports and Athletic Areas
W60.4|Contact with plant thorns and spines and sharp leaves, Street and Highway
W60.5|Contact with plant thorns and spines and sharp leaves, Trade and Service Area
W60.6|Contact with plant thorns and spines and sharp leaves, Industrial and Construction Area
W60.7|Contact with plant thorns and spines and sharp leaves, Farm
W60.8|Contact with plant thorns and spines and sharp leaves, Other Specified Area
W60.9|Contact with plant thorns and spines and sharp leaves, Unspecified Place
W64|Exposure to other and unspecified animate mechanical forces
W64.0|Exposure to other and unspecified animate mechanical forces, Home
W64.1|Exposure to other and unspecified animate mechanical forces, Residential Institution
W64.2|Exposure to other and unspecified animate mechanical forces, School, Other Institution and Public Admimistration Area
W64.3|Exposure to other and unspecified animate mechanical forces, Sports and Athletic Areas
W64.4|Exposure to other and unspecified animate mechanical forces, Street and Highway
W64.5|Exposure to other and unspecified animate mechanical forces, Trade and Service Area
W64.6|Exposure to other and unspecified animate mechanical forces, Industrial and Construction Area
W64.7|Exposure to other and unspecified animate mechanical forces, Farm
W64.8|Exposure to other and unspecified animate mechanical forces, Other Specified Area
W64.9|Exposure to other and unspecified animate mechanical forces, Unspecified Place
W65|Drowning and submersion while in bath-tub
W65.0|Drowning and submersion while in bath-tub, Home
W65.1|Drowning and submersion while in bath-tub, Residential Institution
W65.2|Drowning and submersion while in bath-tub, School, Other Institution and Public Admimistration Area
W65.3|Drowning and submersion while in bath-tub, Sports and Athletic Areas
W65.4|Drowning and submersion while in bath-tub, Street and Highway
W65.5|Drowning and submersion while in bath-tub, Trade and Service Area
W65.6|Drowning and submersion while in bath-tub, Industrial and Construction Area
W65.7|Drowning and submersion while in bath-tub, Farm
W65.8|Drowning and submersion while in bath-tub, Other Specified Area
W65.9|Drowning and submersion while in bath-tub, Unspecified Place
W66|Drowning and submersion following fall into bath-tub
W66.0|Drowning and submersion following fall into bath-tub, Home
W66.1|Drowning and submersion following fall into bath-tub, Residential Institution
W66.2|Drowning and submersion following fall into bath-tub, School, Other Institution and Public Admimistration Area
W66.3|Drowning and submersion following fall into bath-tub, Sports and Athletic Areas
W66.4|Drowning and submersion following fall into bath-tub, Street and Highway
W66.5|Drowning and submersion following fall into bath-tub, Trade and Service Area
W66.6|Drowning and submersion following fall into bath-tub, Industrial and Construction Area
W66.7|Drowning and submersion following fall into bath-tub, Farm
W66.8|Drowning and submersion following fall into bath-tub, Other Specified Area
W66.9|Drowning and submersion following fall into bath-tub, Unspecified Place
W67|Drowning and submersion while in swimming-pool
W67.0|Drowning and submersion while in swimming-pool, Home
W67.1|Drowning and submersion while in swimming-pool, Residential Institution
W67.2|Drowning and submersion while in swimming-pool, School, Other Institution and Public Admimistration Area
W67.3|Drowning and submersion while in swimming-pool, Sports and Athletic Areas
W67.4|Drowning and submersion while in swimming-pool, Street and Highway
W67.5|Drowning and submersion while in swimming-pool, Trade and Service Area
W67.6|Drowning and submersion while in swimming-pool, Industrial and Construction Area
W67.7|Drowning and submersion while in swimming-pool, Farm
W67.8|Drowning and submersion while in swimming-pool, Other Specified Area
W67.9|Drowning and submersion while in swimming-pool, Unspecified Place
W68|Drowning and submersion following fall into swimming-pool
W68.0|Drowning and submersion following fall into swimming-pool, Home
W68.1|Drowning and submersion following fall into swimming-pool, Residential Institution
W68.2|Drowning and submersion following fall into swimming-pool, School, Other Institution and Public Admimistration Area
W68.3|Drowning and submersion following fall into swimming-pool, Sports and Athletic Areas
W68.4|Drowning and submersion following fall into swimming-pool, Street and Highway
W68.5|Drowning and submersion following fall into swimming-pool, Trade and Service Area
W68.6|Drowning and submersion following fall into swimming-pool, Industrial and Construction Area
W68.7|Drowning and submersion following fall into swimming-pool, Farm
W68.8|Drowning and submersion following fall into swimming-pool, Other Specified Area
W68.9|Drowning and submersion following fall into swimming-pool, Unspecified Place
W69|Drowning and submersion while in natural water
W69.0|Drowning and submersion while in natural water, Home
W69.1|Drowning and submersion while in natural water, Residential Institution
W69.2|Drowning and submersion while in natural water, School, Other Institution and Public Admimistration Area
W69.3|Drowning and submersion while in natural water, Sports and Athletic Areas
W69.4|Drowning and submersion while in natural water, Street and Highway
W69.5|Drowning and submersion while in natural water, Trade and Service Area
W69.6|Drowning and submersion while in natural water, Industrial and Construction Area
W69.7|Drowning and submersion while in natural water, Farm
W69.8|Drowning and submersion while in natural water, Other Specified Area
W69.9|Drowning and submersion while in natural water, Unspecified Place
W70|Drowning and submersion following fall into natural water
W70.0|Drowning and submersion following fall into natural water, Home
W70.1|Drowning and submersion following fall into natural water, Residential Institution
W70.2|Drowning and submersion following fall into natural water, School, Other Institution and Public Admimistration Area
W70.3|Drowning and submersion following fall into natural water, Sports and Athletic Areas
W70.4|Drowning and submersion following fall into natural water, Street and Highway
W70.5|Drowning and submersion following fall into natural water, Trade and Service Area
W70.6|Drowning and submersion following fall into natural water, Industrial and Construction Area
W70.7|Drowning and submersion following fall into natural water, Farm
W70.8|Drowning and submersion following fall into natural water, Other Specified Area
W70.9|Drowning and submersion following fall into natural water, Unspecified Place
W73|Other specified drowning and submersion
W73.0|Other specified drowning and submersion, Home
W73.1|Other specified drowning and submersion, Residential Institution
W73.2|Other specified drowning and submersion, School, Other Institution and Public Admimistration Area
W73.3|Other specified drowning and submersion, Sports and Athletic Areas
W73.4|Other specified drowning and submersion, Street and Highway
W73.5|Other specified drowning and submersion, Trade and Service Area
W73.6|Other specified drowning and submersion, Industrial and Construction Area
W73.7|Other specified drowning and submersion, Farm
W73.8|Other specified drowning and submersion, Other Specified Area
W73.9|Other specified drowning and submersion, Unspecified Place
W74|Unspecified drowning and submersion
W74.0|Unspecified drowning and submersion, Home
W74.1|Unspecified drowning and submersion, Residential Institution
W74.2|Unspecified drowning and submersion, School, Other Institution and Public Admimistration Area
W74.3|Unspecified drowning and submersion, Sports and Athletic Areas
W74.4|Unspecified drowning and submersion, Street and Highway
W74.5|Unspecified drowning and submersion, Trade and Service Area
W74.6|Unspecified drowning and submersion, Industrial and Construction Area
W74.7|Unspecified drowning and submersion, Farm
W74.8|Unspecified drowning and submersion, Other Specified Area
W74.9|Unspecified drowning and submersion, Unspecified Place
W75|Accidental suffocation and strangulation in bed
W75.0|Accidental suffocation and strangulation in bed, Home
W75.1|Accidental suffocation and strangulation in bed, Residential Institution
W75.2|Accidental suffocation and strangulation in bed, School, Other Institution and Public Admimistration Area
W75.3|Accidental suffocation and strangulation in bed, Sports and Athletic Areas
W75.4|Accidental suffocation and strangulation in bed, Street and Highway
W75.5|Accidental suffocation and strangulation in bed, Trade and Service Area
W75.6|Accidental suffocation and strangulation in bed, Industrial and Construction Area
W75.7|Accidental suffocation and strangulation in bed, Farm
W75.8|Accidental suffocation and strangulation in bed, Other Specified Area
W75.9|Accidental suffocation and strangulation in bed, Unspecified Place
W76|Other accidental hanging and strangulation
W76.0|Other accidental hanging and strangulation, Home
W76.1|Other accidental hanging and strangulation, Residential Institution
W76.2|Other accidental hanging and strangulation, School, Other Institution and Public Admimistration Area
W76.3|Other accidental hanging and strangulation, Sports and Athletic Areas
W76.4|Other accidental hanging and strangulation, Street and Highway
W76.5|Other accidental hanging and strangulation, Trade and Service Area
W76.6|Other accidental hanging and strangulation, Industrial and Construction Area
W76.7|Other accidental hanging and strangulation, Farm
W76.8|Other accidental hanging and strangulation, Other Specified Area
W76.9|Other accidental hanging and strangulation, Unspecified Place
W77|Threat to breathing due to cave-in, falling earth and other substances
W77.0|Threat to breathing due to cave-in, falling earth and other substances, Home
W77.1|Threat to breathing due to cave-in, falling earth and other substances, Residential Institution
W77.2|Threat to breathing due to cave-in, falling earth and other substances, School, Other Institution and Public Admimistration Area
W77.3|Threat to breathing due to cave-in, falling earth and other substances, Sports and Athletic Areas
W77.4|Threat to breathing due to cave-in, falling earth and other substances, Street and Highway
W77.5|Threat to breathing due to cave-in, falling earth and other substances, Trade and Service Area
W77.6|Threat to breathing due to cave-in, falling earth and other substances, Industrial and Construction Area
W77.7|Threat to breathing due to cave-in, falling earth and other substances, Farm
W77.8|Threat to breathing due to cave-in, falling earth and other substances, Other Specified Area
W77.9|Threat to breathing due to cave-in, falling earth and other substances, Unspecified Place
W78|Inhalation of gastric contents
W78.0|Inhalation of gastric contents, Home
W78.1|Inhalation of gastric contents, Residential Institution
W78.2|Inhalation of gastric contents, School, Other Institution and Public Admimistration Area
W78.3|Inhalation of gastric contents, Sports and Athletic Areas
W78.4|Inhalation of gastric contents, Street and Highway
W78.5|Inhalation of gastric contents, Trade and Service Area
W78.6|Inhalation of gastric contents, Industrial and Construction Area
W78.7|Inhalation of gastric contents, Farm
W78.8|Inhalation of gastric contents, Other Specified Area
W78.9|Inhalation of gastric contents, Unspecified Place
W79|Inhalation and ingestion of food causing obstruction of respiratory tract
W79.0|Inhalation and ingestion of food causing obstruction of respiratory tract, Home
W79.1|Inhalation and ingestion of food causing obstruction of respiratory tract, Residential Institution
W79.2|Inhalation and ingestion of food causing obstruction of respiratory tract, School, Other Institution and Public Admimistration Area
W79.3|Inhalation and ingestion of food causing obstruction of respiratory tract, Sports and Athletic Areas
W79.4|Inhalation and ingestion of food causing obstruction of respiratory tract, Street and Highway
W79.5|Inhalation and ingestion of food causing obstruction of respiratory tract, Trade and Service Area
W79.6|Inhalation and ingestion of food causing obstruction of respiratory tract, Industrial and Construction Area
W79.7|Inhalation and ingestion of food causing obstruction of respiratory tract, Farm
W79.8|Inhalation and ingestion of food causing obstruction of respiratory tract, Other Specified Area
W79.9|Inhalation and ingestion of food causing obstruction of respiratory tract, Unspecified Place
W80|Inhalation and ingestion of other objects causing obstruction of respiratory tract
W80.0|Inhalation and ingestion of other objects causing obstruction of respiratory tract, Home
W80.1|Inhalation and ingestion of other objects causing obstruction of respiratory tract, Residential Institution
W80.2|Inhalation and ingestion of other objects causing obstruction of respiratory tract, School, Other Institution and Public Admimistration Area
W80.3|Inhalation and ingestion of other objects causing obstruction of respiratory tract, Sports and Athletic Areas
W80.4|Inhalation and ingestion of other objects causing obstruction of respiratory tract, Street and Highway
W80.5|Inhalation and ingestion of other objects causing obstruction of respiratory tract, Trade and Service Area
W80.6|Inhalation and ingestion of other objects causing obstruction of respiratory tract, Industrial and Construction Area
W80.7|Inhalation and ingestion of other objects causing obstruction of respiratory tract, Farm
W80.8|Inhalation and ingestion of other objects causing obstruction of respiratory tract, Other Specified Area
W80.9|Inhalation and ingestion of other objects causing obstruction of respiratory tract, Unspecified Place
W81|Confined to or trapped in a low-oxygen environment
W81.0|Confined to or trapped in a low-oxygen environment, Home
W81.1|Confined to or trapped in a low-oxygen environment, Residential Institution
W81.2|Confined to or trapped in a low-oxygen environment, School, Other Institution and Public Admimistration Area
W81.3|Confined to or trapped in a low-oxygen environment, Sports and Athletic Areas
W81.4|Confined to or trapped in a low-oxygen environment, Street and Highway
W81.5|Confined to or trapped in a low-oxygen environment, Trade and Service Area
W81.6|Confined to or trapped in a low-oxygen environment, Industrial and Construction Area
W81.7|Confined to or trapped in a low-oxygen environment, Farm
W81.8|Confined to or trapped in a low-oxygen environment, Other Specified Area
W81.9|Confined to or trapped in a low-oxygen environment, Unspecified Place
W83|Other specified threats to breathing
W83.0|Other specified threats to breathing, Home
W83.1|Other specified threats to breathing, Residential Institution
W83.2|Other specified threats to breathing, School, Other Institution and Public Admimistration Area
W83.3|Other specified threats to breathing, Sports and Athletic Areas
W83.4|Other specified threats to breathing, Street and Highway
W83.5|Other specified threats to breathing, Trade and Service Area
W83.6|Other specified threats to breathing, Industrial and Construction Area
W83.7|Other specified threats to breathing, Farm
W83.8|Other specified threats to breathing, Other Specified Area
W83.9|Other specified threats to breathing, Unspecified Place
W84|Unspecified threat to breathing
W84.0|Unspecified threat to breathing, Home
W84.1|Unspecified threat to breathing, Residential Institution
W84.2|Unspecified threat to breathing, School, Other Institution and Public Admimistration Area
W84.3|Unspecified threat to breathing, Sports and Athletic Areas
W84.4|Unspecified threat to breathing, Street and Highway
W84.5|Unspecified threat to breathing, Trade and Service Area
W84.6|Unspecified threat to breathing, Industrial and Construction Area
W84.7|Unspecified threat to breathing, Farm
W84.8|Unspecified threat to breathing, Other Specified Area
W84.9|Unspecified threat to breathing, Unspecified Place
W85|Exposure to electric transmission lines
W85.0|Exposure to electric transmission lines, Home
W85.1|Exposure to electric transmission lines, Residential Institution
W85.2|Exposure to electric transmission lines, School, Other Institution and Public Admimistration Area
W85.3|Exposure to electric transmission lines, Sports and Athletic Areas
W85.4|Exposure to electric transmission lines, Street and Highway
W85.5|Exposure to electric transmission lines, Trade and Service Area
W85.6|Exposure to electric transmission lines, Industrial and Construction Area
W85.7|Exposure to electric transmission lines, Farm
W85.8|Exposure to electric transmission lines, Other Specified Area
W85.9|Exposure to electric transmission lines, Unspecified Place
W86|Exposure to other specified electric current
W86.0|Exposure to other specified electric current, Home
W86.1|Exposure to other specified electric current, Residential Institution
W86.2|Exposure to other specified electric current, School, Other Institution and Public Admimistration Area
W86.3|Exposure to other specified electric current, Sports and Athletic Areas
W86.4|Exposure to other specified electric current, Street and Highway
W86.5|Exposure to other specified electric current, Trade and Service Area
W86.6|Exposure to other specified electric current, Industrial and Construction Area
W86.7|Exposure to other specified electric current, Farm
W86.8|Exposure to other specified electric current, Other Specified Area
W86.9|Exposure to other specified electric current, Unspecified Place
W87|Exposure to unspecified electric current
W87.0|Exposure to unspecified electric current, Home
W87.1|Exposure to unspecified electric current, Residential Institution
W87.2|Exposure to unspecified electric current, School, Other Institution and Public Admimistration Area
W87.3|Exposure to unspecified electric current, Sports and Athletic Areas
W87.4|Exposure to unspecified electric current, Street and Highway
W87.5|Exposure to unspecified electric current, Trade and Service Area
W87.6|Exposure to unspecified electric current, Industrial and Construction Area
W87.7|Exposure to unspecified electric current, Farm
W87.8|Exposure to unspecified electric current, Other Specified Area
W87.9|Exposure to unspecified electric current, Unspecified Place
W88|Exposure to ionizing radiation
W88.0|Exposure to ionizing radiation, Home
W88.1|Exposure to ionizing radiation, Residential Institution
W88.2|Exposure to ionizing radiation, School, Other Institution and Public Admimistration Area
W88.3|Exposure to ionizing radiation, Sports and Athletic Areas
W88.4|Exposure to ionizing radiation, Street and Highway
W88.5|Exposure to ionizing radiation, Trade and Service Area
W88.6|Exposure to ionizing radiation, Industrial and Construction Area
W88.7|Exposure to ionizing radiation, Farm
W88.8|Exposure to ionizing radiation, Other Specified Area
W88.9|Exposure to ionizing radiation, Unspecified Place
W89|Exposure to man-made visible and ultraviolet light
W89.0|Exposure to man-made visible and ultraviolet light, Home
W89.1|Exposure to man-made visible and ultraviolet light, Residential Institution
W89.2|Exposure to man-made visible and ultraviolet light, School, Other Institution and Public Admimistration Area
W89.3|Exposure to man-made visible and ultraviolet light, Sports and Athletic Areas
W89.4|Exposure to man-made visible and ultraviolet light, Street and Highway
W89.5|Exposure to man-made visible and ultraviolet light, Trade and Service Area
W89.6|Exposure to man-made visible and ultraviolet light, Industrial and Construction Area
W89.7|Exposure to man-made visible and ultraviolet light, Farm
W89.8|Exposure to man-made visible and ultraviolet light, Other Specified Area
W89.9|Exposure to man-made visible and ultraviolet light, Unspecified Place
W90|Exposure to other nonionizing radiation
W90.0|Exposure to other nonionizing radiation, Home
W90.1|Exposure to other nonionizing radiation, Residential Institution
W90.2|Exposure to other nonionizing radiation, School, Other Institution and Public Admimistration Area
W90.3|Exposure to other nonionizing radiation, Sports and Athletic Areas
W90.4|Exposure to other nonionizing radiation, Street and Highway
W90.5|Exposure to other nonionizing radiation, Trade and Service Area
W90.6|Exposure to other nonionizing radiation, Industrial and Construction Area
W90.7|Exposure to other nonionizing radiation, Farm
W90.8|Exposure to other nonionizing radiation, Other Specified Area
W90.9|Exposure to other nonionizing radiation, Unspecified Place
W91|Exposure to unspecified type of radiation
W91.0|Exposure to unspecified type of radiation, Home
W91.1|Exposure to unspecified type of radiation, Residential Institution
W91.2|Exposure to unspecified type of radiation, School, Other Institution and Public Admimistration Area
W91.3|Exposure to unspecified type of radiation, Sports and Athletic Areas
W91.4|Exposure to unspecified type of radiation, Street and Highway
W91.5|Exposure to unspecified type of radiation, Trade and Service Area
W91.6|Exposure to unspecified type of radiation, Industrial and Construction Area
W91.7|Exposure to unspecified type of radiation, Farm
W91.8|Exposure to unspecified type of radiation, Other Specified Area
W91.9|Exposure to unspecified type of radiation, Unspecified Place
W92|Exposure to excessive heat of man-made origin
W92.0|Exposure to excessive heat of man-made origin, Home
W92.1|Exposure to excessive heat of man-made origin, Residential Institution
W92.2|Exposure to excessive heat of man-made origin, School, Other Institution and Public Admimistration Area
W92.3|Exposure to excessive heat of man-made origin, Sports and Athletic Areas
W92.4|Exposure to excessive heat of man-made origin, Street and Highway
W92.5|Exposure to excessive heat of man-made origin, Trade and Service Area
W92.6|Exposure to excessive heat of man-made origin, Industrial and Construction Area
W92.7|Exposure to excessive heat of man-made origin, Farm
W92.8|Exposure to excessive heat of man-made origin, Other Specified Area
W92.9|Exposure to excessive heat of man-made origin, Unspecified Place
W93|Exposure to excessive cold of man-made origin
W93.0|Exposure to excessive cold of man-made origin, Home
W93.1|Exposure to excessive cold of man-made origin, Residential Institution
W93.2|Exposure to excessive cold of man-made origin, School, Other Institution and Public Admimistration Area
W93.3|Exposure to excessive cold of man-made origin, Sports and Athletic Areas
W93.4|Exposure to excessive cold of man-made origin, Street and Highway
W93.5|Exposure to excessive cold of man-made origin, Trade and Service Area
W93.6|Exposure to excessive cold of man-made origin, Industrial and Construction Area
W93.7|Exposure to excessive cold of man-made origin, Farm
W93.8|Exposure to excessive cold of man-made origin, Other Specified Area
W93.9|Exposure to excessive cold of man-made origin, Unspecified Place
W94|Exposure to high and low air pressure and changes in air pressure
W94.0|Exposure to high and low air pressure and changes in air pressure, Home
W94.1|Exposure to high and low air pressure and changes in air pressure, Residential Institution
W94.2|Exposure to high and low air pressure and changes in air pressure, School, Other Institution and Public Admimistration Area
W94.3|Exposure to high and low air pressure and changes in air pressure, Sports and Athletic Areas
W94.4|Exposure to high and low air pressure and changes in air pressure, Street and Highway
W94.5|Exposure to high and low air pressure and changes in air pressure, Trade and Service Area
W94.6|Exposure to high and low air pressure and changes in air pressure, Industrial and Construction Area
W94.7|Exposure to high and low air pressure and changes in air pressure, Farm
W94.8|Exposure to high and low air pressure and changes in air pressure, Other Specified Area
W94.9|Exposure to high and low air pressure and changes in air pressure, Unspecified Place
W99|Exposure to other and unspecified man-made environmental factors
W99.0|Exposure to other and unspecified man-made environmental factors, Home
W99.1|Exposure to other and unspecified man-made environmental factors, Residential Institution
W99.2|Exposure to other and unspecified man-made environmental factors, School, Other Institution and Public Admimistration Area
W99.3|Exposure to other and unspecified man-made environmental factors, Sports and Athletic Areas
W99.4|Exposure to other and unspecified man-made environmental factors, Street and Highway
W99.5|Exposure to other and unspecified man-made environmental factors, Trade and Service Area
W99.6|Exposure to other and unspecified man-made environmental factors, Industrial and Construction Area
W99.7|Exposure to other and unspecified man-made environmental factors, Farm
W99.8|Exposure to other and unspecified man-made environmental factors, Other Specified Area
W99.9|Exposure to other and unspecified man-made environmental factors, Unspecified Place
X00|Exposure to uncontrolled fire in building or structure
X00.0|Exposure to uncontrolled fire in building or structure, Home
X00.1|Exposure to uncontrolled fire in building or structure, Residential Institution
X00.2|Exposure to uncontrolled fire in building or structure, School, Other Institution and Public Admimistration Area
X00.3|Exposure to uncontrolled fire in building or structure, Sports and Athletic Areas
X00.4|Exposure to uncontrolled fire in building or structure, Street and Highway
X00.5|Exposure to uncontrolled fire in building or structure, Trade and Service Area
X00.6|Exposure to uncontrolled fire in building or structure, Industrial and Construction Area
X00.7|Exposure to uncontrolled fire in building or structure, Farm
X00.8|Exposure to uncontrolled fire in building or structure, Other Specified Area
X00.9|Exposure to uncontrolled fire in building or structure, Unspecified Place
X01|Exposure to uncontrolled fire, not in building or structure
X01.0|Exposure to uncontrolled fire, not in building or structure, Home
X01.1|Exposure to uncontrolled fire, not in building or structure, Residential Institution
X01.2|Exposure to uncontrolled fire, not in building or structure, School, Other Institution and Public Admimistration Area
X01.3|Exposure to uncontrolled fire, not in building or structure, Sports and Athletic Areas
X01.4|Exposure to uncontrolled fire, not in building or structure, Street and Highway
X01.5|Exposure to uncontrolled fire, not in building or structure, Trade and Service Area
X01.6|Exposure to uncontrolled fire, not in building or structure, Industrial and Construction Area
X01.7|Exposure to uncontrolled fire, not in building or structure, Farm
X01.8|Exposure to uncontrolled fire, not in building or structure, Other Specified Area
X01.9|Exposure to uncontrolled fire, not in building or structure, Unspecified Place
X02|Exposure to controlled fire in building or structure
X02.0|Exposure to controlled fire in building or structure, Home
X02.1|Exposure to controlled fire in building or structure, Residential Institution
X02.2|Exposure to controlled fire in building or structure, School, Other Institution and Public Admimistration Area
X02.3|Exposure to controlled fire in building or structure, Sports and Athletic Areas
X02.4|Exposure to controlled fire in building or structure, Street and Highway
X02.5|Exposure to controlled fire in building or structure, Trade and Service Area
X02.6|Exposure to controlled fire in building or structure, Industrial and Construction Area
X02.7|Exposure to controlled fire in building or structure, Farm
X02.8|Exposure to controlled fire in building or structure, Other Specified Area
X02.9|Exposure to controlled fire in building or structure, Unspecified Place
X03|Exposure to controlled fire, not in building or structure
X03.0|Exposure to controlled fire, not in building or structure, Home
X03.1|Exposure to controlled fire, not in building or structure, Residential Institution
X03.2|Exposure to controlled fire, not in building or structure, School, Other Institution and Public Admimistration Area
X03.3|Exposure to controlled fire, not in building or structure, Sports and Athletic Areas
X03.4|Exposure to controlled fire, not in building or structure, Street and Highway
X03.5|Exposure to controlled fire, not in building or structure, Trade and Service Area
X03.6|Exposure to controlled fire, not in building or structure, Industrial and Construction Area
X03.7|Exposure to controlled fire, not in building or structure, Farm
X03.8|Exposure to controlled fire, not in building or structure, Other Specified Area
X03.9|Exposure to controlled fire, not in building or structure, Unspecified Place
X04|Exposure to ignition of highly flammable material
X04.0|Exposure to ignition of highly flammable material, Home
X04.1|Exposure to ignition of highly flammable material, Residential Institution
X04.2|Exposure to ignition of highly flammable material, School, Other Institution and Public Admimistration Area
X04.3|Exposure to ignition of highly flammable material, Sports and Athletic Areas
X04.4|Exposure to ignition of highly flammable material, Street and Highway
X04.5|Exposure to ignition of highly flammable material, Trade and Service Area
X04.6|Exposure to ignition of highly flammable material, Industrial and Construction Area
X04.7|Exposure to ignition of highly flammable material, Farm
X04.8|Exposure to ignition of highly flammable material, Other Specified Area
X04.9|Exposure to ignition of highly flammable material, Unspecified Place
X05|Exposure to ignition or melting of nightwear
X05.0|Exposure to ignition or melting of nightwear, Home
X05.1|Exposure to ignition or melting of nightwear, Residential Institution
X05.2|Exposure to ignition or melting of nightwear, School, Other Institution and Public Admimistration Area
X05.3|Exposure to ignition or melting of nightwear, Sports and Athletic Areas
X05.4|Exposure to ignition or melting of nightwear, Street and Highway
X05.5|Exposure to ignition or melting of nightwear, Trade and Service Area
X05.6|Exposure to ignition or melting of nightwear, Industrial and Construction Area
X05.7|Exposure to ignition or melting of nightwear, Farm
X05.8|Exposure to ignition or melting of nightwear, Other Specified Area
X05.9|Exposure to ignition or melting of nightwear, Unspecified Place
X06|Exposure to ignition or melting of other clothing and apparel
X06.0|Exposure to ignition or melting of other clothing and apparel, Home
X06.1|Exposure to ignition or melting of other clothing and apparel, Residential Institution
X06.2|Exposure to ignition or melting of other clothing and apparel, School, Other Institution and Public Admimistration Area
X06.3|Exposure to ignition or melting of other clothing and apparel, Sports and Athletic Areas
X06.4|Exposure to ignition or melting of other clothing and apparel, Street and Highway
X06.5|Exposure to ignition or melting of other clothing and apparel, Trade and Service Area
X06.6|Exposure to ignition or melting of other clothing and apparel, Industrial and Construction Area
X06.7|Exposure to ignition or melting of other clothing and apparel, Farm
X06.8|Exposure to ignition or melting of other clothing and apparel, Other Specified Area
X06.9|Exposure to ignition or melting of other clothing and apparel, Unspecified Place
X08|Exposure to other specified smoke, fire and flames
X08.0|Exposure to other specified smoke, fire and flames, Home
X08.1|Exposure to other specified smoke, fire and flames, Residential Institution
X08.2|Exposure to other specified smoke, fire and flames, School, Other Institution and Public Admimistration Area
X08.3|Exposure to other specified smoke, fire and flames, Sports and Athletic Areas
X08.4|Exposure to other specified smoke, fire and flames, Street and Highway
X08.5|Exposure to other specified smoke, fire and flames, Trade and Service Area
X08.6|Exposure to other specified smoke, fire and flames, Industrial and Construction Area
X08.7|Exposure to other specified smoke, fire and flames, Farm
X08.8|Exposure to other specified smoke, fire and flames, Other Specified Area
X08.9|Exposure to other specified smoke, fire and flames, Unspecified Place
X09|Exposure to unspecified smoke, fire and flames
X09.0|Exposure to unspecified smoke, fire and flames, Home
X09.1|Exposure to unspecified smoke, fire and flames, Residential Institution
X09.2|Exposure to unspecified smoke, fire and flames, School, Other Institution and Public Admimistration Area
X09.3|Exposure to unspecified smoke, fire and flames, Sports and Athletic Areas
X09.4|Exposure to unspecified smoke, fire and flames, Street and Highway
X09.5|Exposure to unspecified smoke, fire and flames, Trade and Service Area
X09.6|Exposure to unspecified smoke, fire and flames, Industrial and Construction Area
X09.7|Exposure to unspecified smoke, fire and flames, Farm
X09.8|Exposure to unspecified smoke, fire and flames, Other Specified Area
X09.9|Exposure to unspecified smoke, fire and flames, Unspecified Place
X10|Contact with hot drinks, food, fats and cooking oils
X10.0|Contact with hot drinks, food, fats and cooking oils, Home
X10.1|Contact with hot drinks, food, fats and cooking oils, Residential Institution
X10.2|Contact with hot drinks, food, fats and cooking oils, School, Other Institution and Public Admimistration Area
X10.3|Contact with hot drinks, food, fats and cooking oils, Sports and Athletic Areas
X10.4|Contact with hot drinks, food, fats and cooking oils, Street and Highway
X10.5|Contact with hot drinks, food, fats and cooking oils, Trade and Service Area
X10.6|Contact with hot drinks, food, fats and cooking oils, Industrial and Construction Area
X10.7|Contact with hot drinks, food, fats and cooking oils, Farm
X10.8|Contact with hot drinks, food, fats and cooking oils, Other Specified Area
X10.9|Contact with hot drinks, food, fats and cooking oils, Unspecified Place
X11|Contact with hot tap-water
X11.0|Contact with hot tap-water, Home
X11.1|Contact with hot tap-water, Residential Institution
X11.2|Contact with hot tap-water, School, Other Institution and Public Admimistration Area
X11.3|Contact with hot tap-water, Sports and Athletic Areas
X11.4|Contact with hot tap-water, Street and Highway
X11.5|Contact with hot tap-water, Trade and Service Area
X11.6|Contact with hot tap-water, Industrial and Construction Area
X11.7|Contact with hot tap-water, Farm
X11.8|Contact with hot tap-water, Other Specified Area
X11.9|Contact with hot tap-water, Unspecified Place
X12|Contact with other hot fluids
X12.0|Contact with other hot fluids, Home
X12.1|Contact with other hot fluids, Residential Institution
X12.2|Contact with other hot fluids, School, Other Institution and Public Admimistration Area
X12.3|Contact with other hot fluids, Sports and Athletic Areas
X12.4|Contact with other hot fluids, Street and Highway
X12.5|Contact with other hot fluids, Trade and Service Area
X12.6|Contact with other hot fluids, Industrial and Construction Area
X12.7|Contact with other hot fluids, Farm
X12.8|Contact with other hot fluids, Other Specified Area
X12.9|Contact with other hot fluids, Unspecified Place
X13|Contact with steam and hot vapours
X13.0|Contact with steam and hot vapours, Home
X13.1|Contact with steam and hot vapours, Residential Institution
X13.2|Contact with steam and hot vapours, School, Other Institution and Public Admimistration Area
X13.3|Contact with steam and hot vapours, Sports and Athletic Areas
X13.4|Contact with steam and hot vapours, Street and Highway
X13.5|Contact with steam and hot vapours, Trade and Service Area
X13.6|Contact with steam and hot vapours, Industrial and Construction Area
X13.7|Contact with steam and hot vapours, Farm
X13.8|Contact with steam and hot vapours, Other Specified Area
X13.9|Contact with steam and hot vapours, Unspecified Place
X14|Contact with hot air and gases
X14.0|Contact with hot air and gases, Home
X14.1|Contact with hot air and gases, Residential Institution
X14.2|Contact with hot air and gases, School, Other Institution and Public Admimistration Area
X14.3|Contact with hot air and gases, Sports and Athletic Areas
X14.4|Contact with hot air and gases, Street and Highway
X14.5|Contact with hot air and gases, Trade and Service Area
X14.6|Contact with hot air and gases, Industrial and Construction Area
X14.7|Contact with hot air and gases, Farm
X14.8|Contact with hot air and gases, Other Specified Area
X14.9|Contact with hot air and gases, Unspecified Place
X15|Contact with hot household appliances
X15.0|Contact with hot household appliances, Home
X15.1|Contact with hot household appliances, Residential Institution
X15.2|Contact with hot household appliances, School, Other Institution and Public Admimistration Area
X15.3|Contact with hot household appliances, Sports and Athletic Areas
X15.4|Contact with hot household appliances, Street and Highway
X15.5|Contact with hot household appliances, Trade and Service Area
X15.6|Contact with hot household appliances, Industrial and Construction Area
X15.7|Contact with hot household appliances, Farm
X15.8|Contact with hot household appliances, Other Specified Area
X15.9|Contact with hot household appliances, Unspecified Place
X16|Contact with hot heating appliances, radiators and pipes
X16.0|Contact with hot heating appliances, radiators and pipes, Home
X16.1|Contact with hot heating appliances, radiators and pipes, Residential Institution
X16.2|Contact with hot heating appliances, radiators and pipes, School, Other Institution and Public Admimistration Area
X16.3|Contact with hot heating appliances, radiators and pipes, Sports and Athletic Areas
X16.4|Contact with hot heating appliances, radiators and pipes, Street and Highway
X16.5|Contact with hot heating appliances, radiators and pipes, Trade and Service Area
X16.6|Contact with hot heating appliances, radiators and pipes, Industrial and Construction Area
X16.7|Contact with hot heating appliances, radiators and pipes, Farm
X16.8|Contact with hot heating appliances, radiators and pipes, Other Specified Area
X16.9|Contact with hot heating appliances, radiators and pipes, Unspecified Place
X17|Contact with hot engines, machinery and tools
X17.0|Contact with hot engines, machinery and tools, Home
X17.1|Contact with hot engines, machinery and tools, Residential Institution
X17.2|Contact with hot engines, machinery and tools, School, Other Institution and Public Admimistration Area
X17.3|Contact with hot engines, machinery and tools, Sports and Athletic Areas
X17.4|Contact with hot engines, machinery and tools, Street and Highway
X17.5|Contact with hot engines, machinery and tools, Trade and Service Area
X17.6|Contact with hot engines, machinery and tools, Industrial and Construction Area
X17.7|Contact with hot engines, machinery and tools, Farm
X17.8|Contact with hot engines, machinery and tools, Other Specified Area
X17.9|Contact with hot engines, machinery and tools, Unspecified Place
X18|Contact with other hot metals
X18.0|Contact with other hot metals, Home
X18.1|Contact with other hot metals, Residential Institution
X18.2|Contact with other hot metals, School, Other Institution and Public Admimistration Area
X18.3|Contact with other hot metals, Sports and Athletic Areas
X18.4|Contact with other hot metals, Street and Highway
X18.5|Contact with other hot metals, Trade and Service Area
X18.6|Contact with other hot metals, Industrial and Construction Area
X18.7|Contact with other hot metals, Farm
X18.8|Contact with other hot metals, Other Specified Area
X18.9|Contact with other hot metals, Unspecified Place
X19|Contact with other and unspecified heat and hot substances
X19.0|Contact with other and unspecified heat and hot substances, Home
X19.1|Contact with other and unspecified heat and hot substances, Residential Institution
X19.2|Contact with other and unspecified heat and hot substances, School, Other Institution and Public Admimistration Area
X19.3|Contact with other and unspecified heat and hot substances, Sports and Athletic Areas
X19.4|Contact with other and unspecified heat and hot substances, Street and Highway
X19.5|Contact with other and unspecified heat and hot substances, Trade and Service Area
X19.6|Contact with other and unspecified heat and hot substances, Industrial and Construction Area
X19.7|Contact with other and unspecified heat and hot substances, Farm
X19.8|Contact with other and unspecified heat and hot substances, Other Specified Area
X19.9|Contact with other and unspecified heat and hot substances, Unspecified Place
X20|Contact with venomous snakes and lizards
X20.0|Contact with venomous snakes and lizards, Home
X20.1|Contact with venomous snakes and lizards, Residential Institution
X20.2|Contact with venomous snakes and lizards, School, Other Institution and Public Admimistration Area
X20.3|Contact with venomous snakes and lizards, Sports and Athletic Areas
X20.4|Contact with venomous snakes and lizards, Street and Highway
X20.5|Contact with venomous snakes and lizards, Trade and Service Area
X20.6|Contact with venomous snakes and lizards, Industrial and Construction Area
X20.7|Contact with venomous snakes and lizards, Farm
X20.8|Contact with venomous snakes and lizards, Other Specified Area
X20.9|Contact with venomous snakes and lizards, Unspecified Place
X21|Contact with venomous spiders
X21.0|Contact with venomous spiders, Home
X21.1|Contact with venomous spiders, Residential Institution
X21.2|Contact with venomous spiders, School, Other Institution and Public Admimistration Area
X21.3|Contact with venomous spiders, Sports and Athletic Areas
X21.4|Contact with venomous spiders, Street and Highway
X21.5|Contact with venomous spiders, Trade and Service Area
X21.6|Contact with venomous spiders, Industrial and Construction Area
X21.7|Contact with venomous spiders, Farm
X21.8|Contact with venomous spiders, Other Specified Area
X21.9|Contact with venomous spiders, Unspecified Place
X22|Contact with scorpions
X22.0|Contact with scorpions, Home
X22.1|Contact with scorpions, Residential Institution
X22.2|Contact with scorpions, School, Other Institution and Public Admimistration Area
X22.3|Contact with scorpions, Sports and Athletic Areas
X22.4|Contact with scorpions, Street and Highway
X22.5|Contact with scorpions, Trade and Service Area
X22.6|Contact with scorpions, Industrial and Construction Area
X22.7|Contact with scorpions, Farm
X22.8|Contact with scorpions, Other Specified Area
X22.9|Contact with scorpions, Unspecified Place
X23|Contact with hornets, wasps and bees
X23.0|Contact with hornets, wasps and bees, Home
X23.1|Contact with hornets, wasps and bees, Residential Institution
X23.2|Contact with hornets, wasps and bees, School, Other Institution and Public Admimistration Area
X23.3|Contact with hornets, wasps and bees, Sports and Athletic Areas
X23.4|Contact with hornets, wasps and bees, Street and Highway
X23.5|Contact with hornets, wasps and bees, Trade and Service Area
X23.6|Contact with hornets, wasps and bees, Industrial and Construction Area
X23.7|Contact with hornets, wasps and bees, Farm
X23.8|Contact with hornets, wasps and bees, Other Specified Area
X23.9|Contact with hornets, wasps and bees, Unspecified Place
X24|Contact with centipedes and venomous millipedes (tropical)
X24.0|Contact with centipedes and venomous millipedes (tropical), Home
X24.1|Contact with centipedes and venomous millipedes (tropical), Residential Institution
X24.2|Contact with centipedes and venomous millipedes (tropical), School, Other Institution and Public Admimistration Area
X24.3|Contact with centipedes and venomous millipedes (tropical), Sports and Athletic Areas
X24.4|Contact with centipedes and venomous millipedes (tropical), Street and Highway
X24.5|Contact with centipedes and venomous millipedes (tropical), Trade and Service Area
X24.6|Contact with centipedes and venomous millipedes (tropical), Industrial and Construction Area
X24.7|Contact with centipedes and venomous millipedes (tropical), Farm
X24.8|Contact with centipedes and venomous millipedes (tropical), Other Specified Area
X24.9|Contact with centipedes and venomous millipedes (tropical), Unspecified Place
X25|Contact with other venomous arthropods
X25.0|Contact with other venomous arthropods, Home
X25.1|Contact with other venomous arthropods, Residential Institution
X25.2|Contact with other venomous arthropods, School, Other Institution and Public Admimistration Area
X25.3|Contact with other venomous arthropods, Sports and Athletic Areas
X25.4|Contact with other venomous arthropods, Street and Highway
X25.5|Contact with other venomous arthropods, Trade and Service Area
X25.6|Contact with other venomous arthropods, Industrial and Construction Area
X25.7|Contact with other venomous arthropods, Farm
X25.8|Contact with other venomous arthropods, Other Specified Area
X25.9|Contact with other venomous arthropods, Unspecified Place
X26|Contact with venomous marine animals and plants
X26.0|Contact with venomous marine animals and plants, Home
X26.1|Contact with venomous marine animals and plants, Residential Institution
X26.2|Contact with venomous marine animals and plants, School, Other Institution and Public Admimistration Area
X26.3|Contact with venomous marine animals and plants, Sports and Athletic Areas
X26.4|Contact with venomous marine animals and plants, Street and Highway
X26.5|Contact with venomous marine animals and plants, Trade and Service Area
X26.6|Contact with venomous marine animals and plants, Industrial and Construction Area
X26.7|Contact with venomous marine animals and plants, Farm
X26.8|Contact with venomous marine animals and plants, Other Specified Area
X26.9|Contact with venomous marine animals and plants, Unspecified Place
X27|Contact with other specified venomous animals
X27.0|Contact with other specified venomous animals, Home
X27.1|Contact with other specified venomous animals, Residential Institution
X27.2|Contact with other specified venomous animals, School, Other Institution and Public Admimistration Area
X27.3|Contact with other specified venomous animals, Sports and Athletic Areas
X27.4|Contact with other specified venomous animals, Street and Highway
X27.5|Contact with other specified venomous animals, Trade and Service Area
X27.6|Contact with other specified venomous animals, Industrial and Construction Area
X27.7|Contact with other specified venomous animals, Farm
X27.8|Contact with other specified venomous animals, Other Specified Area
X27.9|Contact with other specified venomous animals, Unspecified Place
X28|Contact with other specified venomous plants
X28.0|Contact with other specified venomous plants, Home
X28.1|Contact with other specified venomous plants, Residential Institution
X28.2|Contact with other specified venomous plants, School, Other Institution and Public Admimistration Area
X28.3|Contact with other specified venomous plants, Sports and Athletic Areas
X28.4|Contact with other specified venomous plants, Street and Highway
X28.5|Contact with other specified venomous plants, Trade and Service Area
X28.6|Contact with other specified venomous plants, Industrial and Construction Area
X28.7|Contact with other specified venomous plants, Farm
X28.8|Contact with other specified venomous plants, Other Specified Area
X28.9|Contact with other specified venomous plants, Unspecified Place
X29|Contact with unspecified venomous animal or plant
X29.0|Contact with unspecified venomous animal or plant, Home
X29.1|Contact with unspecified venomous animal or plant, Residential Institution
X29.2|Contact with unspecified venomous animal or plant, School, Other Institution and Public Admimistration Area
X29.3|Contact with unspecified venomous animal or plant, Sports and Athletic Areas
X29.4|Contact with unspecified venomous animal or plant, Street and Highway
X29.5|Contact with unspecified venomous animal or plant, Trade and Service Area
X29.6|Contact with unspecified venomous animal or plant, Industrial and Construction Area
X29.7|Contact with unspecified venomous animal or plant, Farm
X29.8|Contact with unspecified venomous animal or plant, Other Specified Area
X29.9|Contact with unspecified venomous animal or plant, Unspecified Place
X30|Exposure to excessive natural heat
X30.0|Exposure to excessive natural heat, Home
X30.1|Exposure to excessive natural heat, Residential Institution
X30.2|Exposure to excessive natural heat, School, Other Institution and Public Admimistration Area
X30.3|Exposure to excessive natural heat, Sports and Athletic Areas
X30.4|Exposure to excessive natural heat, Street and Highway
X30.5|Exposure to excessive natural heat, Trade and Service Area
X30.6|Exposure to excessive natural heat, Industrial and Construction Area
X30.7|Exposure to excessive natural heat, Farm
X30.8|Exposure to excessive natural heat, Other Specified Area
X30.9|Exposure to excessive natural heat, Unspecified Place
X31|Exposure to excessive natural cold
X31.0|Exposure to excessive natural cold, Home
X31.1|Exposure to excessive natural cold, Residential Institution
X31.2|Exposure to excessive natural cold, School, Other Institution and Public Admimistration Area
X31.3|Exposure to excessive natural cold, Sports and Athletic Areas
X31.4|Exposure to excessive natural cold, Street and Highway
X31.5|Exposure to excessive natural cold, Trade and Service Area
X31.6|Exposure to excessive natural cold, Industrial and Construction Area
X31.7|Exposure to excessive natural cold, Farm
X31.8|Exposure to excessive natural cold, Other Specified Area
X31.9|Exposure to excessive natural cold, Unspecified Place
X32|Exposure to sunlight
X32.0|Exposure to sunlight, Home
X32.1|Exposure to sunlight, Residential Institution
X32.2|Exposure to sunlight, School, Other Institution and Public Admimistration Area
X32.3|Exposure to sunlight, Sports and Athletic Areas
X32.4|Exposure to sunlight, Street and Highway
X32.5|Exposure to sunlight, Trade and Service Area
X32.6|Exposure to sunlight, Industrial and Construction Area
X32.7|Exposure to sunlight, Farm
X32.8|Exposure to sunlight, Other Specified Area
X32.9|Exposure to sunlight, Unspecified Place
X33|Victim of lightning
X33.0|Victim of lightning, Home
X33.1|Victim of lightning, Residential Institution
X33.2|Victim of lightning, School, Other Institution and Public Admimistration Area
X33.3|Victim of lightning, Sports and Athletic Areas
X33.4|Victim of lightning, Street and Highway
X33.5|Victim of lightning, Trade and Service Area
X33.6|Victim of lightning, Industrial and Construction Area
X33.7|Victim of lightning, Farm
X33.8|Victim of lightning, Other Specified Area
X33.9|Victim of lightning, Unspecified Place
X34|Victim of earthquake
X34.0|Victim of earthquake, Home
X34.1|Victim of earthquake, Residential Institution
X34.2|Victim of earthquake, School, Other Institution and Public Admimistration Area
X34.3|Victim of earthquake, Sports and Athletic Areas
X34.4|Victim of earthquake, Street and Highway
X34.5|Victim of earthquake, Trade and Service Area
X34.6|Victim of earthquake, Industrial and Construction Area
X34.7|Victim of earthquake, Farm
X34.8|Victim of earthquake, Other Specified Area
X34.9|Victim of earthquake, Unspecified Place
X35|Victim of volcanic eruption
X35.0|Victim of volcanic eruption, Home
X35.1|Victim of volcanic eruption, Residential Institution
X35.2|Victim of volcanic eruption, School, Other Institution and Public Admimistration Area
X35.3|Victim of volcanic eruption, Sports and Athletic Areas
X35.4|Victim of volcanic eruption, Street and Highway
X35.5|Victim of volcanic eruption, Trade and Service Area
X35.6|Victim of volcanic eruption, Industrial and Construction Area
X35.7|Victim of volcanic eruption, Farm
X35.8|Victim of volcanic eruption, Other Specified Area
X35.9|Victim of volcanic eruption, Unspecified Place
X36|Victim of avalanche, landslide and other earth movements
X36.0|Victim of avalanche, landslide and other earth movements, Home
X36.1|Victim of avalanche, landslide and other earth movements, Residential Institution
X36.2|Victim of avalanche, landslide and other earth movements, School, Other Institution and Public Admimistration Area
X36.3|Victim of avalanche, landslide and other earth movements, Sports and Athletic Areas
X36.4|Victim of avalanche, landslide and other earth movements, Street and Highway
X36.5|Victim of avalanche, landslide and other earth movements, Trade and Service Area
X36.6|Victim of avalanche, landslide and other earth movements, Industrial and Construction Area
X36.7|Victim of avalanche, landslide and other earth movements, Farm
X36.8|Victim of avalanche, landslide and other earth movements, Other Specified Area
X36.9|Victim of avalanche, landslide and other earth movements, Unspecified Place
X37|Victim of cataclysmic storm
X37.0|Victim of cataclysmic storm, Home
X37.1|Victim of cataclysmic storm, Residential Institution
X37.2|Victim of cataclysmic storm, School, Other Institution and Public Admimistration Area
X37.3|Victim of cataclysmic storm, Sports and Athletic Areas
X37.4|Victim of cataclysmic storm, Street and Highway
X37.5|Victim of cataclysmic storm, Trade and Service Area
X37.6|Victim of cataclysmic storm, Industrial and Construction Area
X37.7|Victim of cataclysmic storm, Farm
X37.8|Victim of cataclysmic storm, Other Specified Area
X37.9|Victim of cataclysmic storm, Unspecified Place
X38|Victim of flood
X38.0|Victim of flood, Home
X38.1|Victim of flood, Residential Institution
X38.2|Victim of flood, School, Other Institution and Public Admimistration Area
X38.3|Victim of flood, Sports and Athletic Areas
X38.4|Victim of flood, Street and Highway
X38.5|Victim of flood, Trade and Service Area
X38.6|Victim of flood, Industrial and Construction Area
X38.7|Victim of flood, Farm
X38.8|Victim of flood, Other Specified Area
X38.9|Victim of flood, Unspecified Place
X39|Exposure to other and unspecified forces of nature
X39.0|Exposure to other and unspecified forces of nature, Home
X39.1|Exposure to other and unspecified forces of nature, Residential Institution
X39.2|Exposure to other and unspecified forces of nature, School, Other Institution and Public Admimistration Area
X39.3|Exposure to other and unspecified forces of nature, Sports and Athletic Areas
X39.4|Exposure to other and unspecified forces of nature, Street and Highway
X39.5|Exposure to other and unspecified forces of nature, Trade and Service Area
X39.6|Exposure to other and unspecified forces of nature, Industrial and Construction Area
X39.7|Exposure to other and unspecified forces of nature, Farm
X39.8|Exposure to other and unspecified forces of nature, Other Specified Area
X39.9|Exposure to other and unspecified forces of nature, Unspecified Place
X40|Accidental poisoning by and exposure to nonopioid analgesics, antipyretics and antirheumatics
X40.0|Accidental poisoning by and exposure to nonopioid analgesics, antipyretics and antirheumatics, Home
X40.1|Accidental poisoning by and exposure to nonopioid analgesics, antipyretics and antirheumatics, Residential Institution
X40.2|Accidental poisoning by and exposure to nonopioid analgesics, antipyretics and antirheumatics, School, Other Institution and Public Admimistration Area
X40.3|Accidental poisoning by and exposure to nonopioid analgesics, antipyretics and antirheumatics, Sports and Athletic Areas
X40.4|Accidental poisoning by and exposure to nonopioid analgesics, antipyretics and antirheumatics, Street and Highway
X40.5|Accidental poisoning by and exposure to nonopioid analgesics, antipyretics and antirheumatics, Trade and Service Area
X40.6|Accidental poisoning by and exposure to nonopioid analgesics, antipyretics and antirheumatics, Industrial and Construction Area
X40.7|Accidental poisoning by and exposure to nonopioid analgesics, antipyretics and antirheumatics, Farm
X40.8|Accidental poisoning by and exposure to nonopioid analgesics, antipyretics and antirheumatics, Other Specified Area
X40.9|Accidental poisoning by and exposure to nonopioid analgesics, antipyretics and antirheumatics, Unspecified Place
X41|Accidental poisoning by and exposure to antiepileptic, sedative-hypnotic, antiparkinsonism and psychotropic drugs, not elsewhere classified
X41.0|Accidental poisoning by and exposure to antiepileptic, sedative-hypnotic, antiparkinsonism and psychotropic drugs, not elsewhere classified, Home
X41.1|Accidental poisoning by and exposure to antiepileptic, sedative-hypnotic, antiparkinsonism and psychotropic drugs, not elsewhere classified, Residential Institution
X41.2|Accidental poisoning by and exposure to antiepileptic, sedative-hypnotic, antiparkinsonism and psychotropic drugs, not elsewhere classified, School, Other Institution and Public Admimistration Area
X41.3|Accidental poisoning by and exposure to antiepileptic, sedative-hypnotic, antiparkinsonism and psychotropic drugs, not elsewhere classified, Sports and Athletic Areas
X41.4|Accidental poisoning by and exposure to antiepileptic, sedative-hypnotic, antiparkinsonism and psychotropic drugs, not elsewhere classified, Street and Highway
X41.5|Accidental poisoning by and exposure to antiepileptic, sedative-hypnotic, antiparkinsonism and psychotropic drugs, not elsewhere classified, Trade and Service Area
X41.6|Accidental poisoning by and exposure to antiepileptic, sedative-hypnotic, antiparkinsonism and psychotropic drugs, not elsewhere classified, Industrial and Construction Area
X41.7|Accidental poisoning by and exposure to antiepileptic, sedative-hypnotic, antiparkinsonism and psychotropic drugs, not elsewhere classified, Farm
X41.8|Accidental poisoning by and exposure to antiepileptic, sedative-hypnotic, antiparkinsonism and psychotropic drugs, not elsewhere classified, Other Specified Area
X41.9|Accidental poisoning by and exposure to antiepileptic, sedative-hypnotic, antiparkinsonism and psychotropic drugs, not elsewhere classified, Unspecified Place
X42|Accidental poisoning by and exposure to narcotics and psychodysleptics [hallucinogens], not elsewhere classified
X42.0|Accidental poisoning by and exposure to narcotics and psychodysleptics [hallucinogens], not elsewhere classified, Home
X42.1|Accidental poisoning by and exposure to narcotics and psychodysleptics [hallucinogens], not elsewhere classified, Residential Institution
X42.2|Accidental poisoning by and exposure to narcotics and psychodysleptics [hallucinogens], not elsewhere classified, School, Other Institution and Public Admimistration Area
X42.3|Accidental poisoning by and exposure to narcotics and psychodysleptics [hallucinogens], not elsewhere classified, Sports and Athletic Areas
X42.4|Accidental poisoning by and exposure to narcotics and psychodysleptics [hallucinogens], not elsewhere classified, Street and Highway
X42.5|Accidental poisoning by and exposure to narcotics and psychodysleptics [hallucinogens], not elsewhere classified, Trade and Service Area
X42.6|Accidental poisoning by and exposure to narcotics and psychodysleptics [hallucinogens], not elsewhere classified, Industrial and Construction Area
X42.7|Accidental poisoning by and exposure to narcotics and psychodysleptics [hallucinogens], not elsewhere classified, Farm
X42.8|Accidental poisoning by and exposure to narcotics and psychodysleptics [hallucinogens], not elsewhere classified, Other Specified Area
X42.9|Accidental poisoning by and exposure to narcotics and psychodysleptics [hallucinogens], not elsewhere classified, Unspecified Place
X43|Accidental poisoning by and exposure to other drugs acting on the autonomic nervous system
X43.0|Accidental poisoning by and exposure to other drugs acting on the autonomic nervous system, Home
X43.1|Accidental poisoning by and exposure to other drugs acting on the autonomic nervous system, Residential Institution
X43.2|Accidental poisoning by and exposure to other drugs acting on the autonomic nervous system, School, Other Institution and Public Admimistration Area
X43.3|Accidental poisoning by and exposure to other drugs acting on the autonomic nervous system, Sports and Athletic Areas
X43.4|Accidental poisoning by and exposure to other drugs acting on the autonomic nervous system, Street and Highway
X43.5|Accidental poisoning by and exposure to other drugs acting on the autonomic nervous system, Trade and Service Area
X43.6|Accidental poisoning by and exposure to other drugs acting on the autonomic nervous system, Industrial and Construction Area
X43.7|Accidental poisoning by and exposure to other drugs acting on the autonomic nervous system, Farm
X43.8|Accidental poisoning by and exposure to other drugs acting on the autonomic nervous system, Other Specified Area
X43.9|Accidental poisoning by and exposure to other drugs acting on the autonomic nervous system, Unspecified Place
X44|Accidental poisoning by and exposure to other and unspecified drugs, medicaments and biological substances
X44.0|Accidental poisoning by and exposure to other and unspecified drugs, medicaments and biological substances, Home
X44.1|Accidental poisoning by and exposure to other and unspecified drugs, medicaments and biological substances, Residential Institution
X44.2|Accidental poisoning by and exposure to other and unspecified drugs, medicaments and biological substances, School, Other Institution and Public Admimistration Area
X44.3|Accidental poisoning by and exposure to other and unspecified drugs, medicaments and biological substances, Sports and Athletic Areas
X44.4|Accidental poisoning by and exposure to other and unspecified drugs, medicaments and biological substances, Street and Highway
X44.5|Accidental poisoning by and exposure to other and unspecified drugs, medicaments and biological substances, Trade and Service Area
X44.6|Accidental poisoning by and exposure to other and unspecified drugs, medicaments and biological substances, Industrial and Construction Area
X44.7|Accidental poisoning by and exposure to other and unspecified drugs, medicaments and biological substances, Farm
X44.8|Accidental poisoning by and exposure to other and unspecified drugs, medicaments and biological substances, Other Specified Area
X44.9|Accidental poisoning by and exposure to other and unspecified drugs, medicaments and biological substances, Unspecified Place
X45|Accidental poisoning by and exposure to alcohol
X45.0|Accidental poisoning by and exposure to alcohol, Home
X45.1|Accidental poisoning by and exposure to alcohol, Residential Institution
X45.2|Accidental poisoning by and exposure to alcohol, School, Other Institution and Public Admimistration Area
X45.3|Accidental poisoning by and exposure to alcohol, Sports and Athletic Areas
X45.4|Accidental poisoning by and exposure to alcohol, Street and Highway
X45.5|Accidental poisoning by and exposure to alcohol, Trade and Service Area
X45.6|Accidental poisoning by and exposure to alcohol, Industrial and Construction Area
X45.7|Accidental poisoning by and exposure to alcohol, Farm
X45.8|Accidental poisoning by and exposure to alcohol, Other Specified Area
X45.9|Accidental poisoning by and exposure to alcohol, Unspecified Place
X46|Accidental poisoning by and exposure to organic solvents and halogenated hydrocarbons and their vapours
X46.0|Accidental poisoning by and exposure to organic solvents and halogenated hydrocarbons and their vapours, Home
X46.1|Accidental poisoning by and exposure to organic solvents and halogenated hydrocarbons and their vapours, Residential Institution
X46.2|Accidental poisoning by and exposure to organic solvents and halogenated hydrocarbons and their vapours, School, Other Institution and Public Admimistration Area
X46.3|Accidental poisoning by and exposure to organic solvents and halogenated hydrocarbons and their vapours, Sports and Athletic Areas
X46.4|Accidental poisoning by and exposure to organic solvents and halogenated hydrocarbons and their vapours, Street and Highway
X46.5|Accidental poisoning by and exposure to organic solvents and halogenated hydrocarbons and their vapours, Trade and Service Area
X46.6|Accidental poisoning by and exposure to organic solvents and halogenated hydrocarbons and their vapours, Industrial and Construction Area
X46.7|Accidental poisoning by and exposure to organic solvents and halogenated hydrocarbons and their vapours, Farm
X46.8|Accidental poisoning by and exposure to organic solvents and halogenated hydrocarbons and their vapours, Other Specified Area
X46.9|Accidental poisoning by and exposure to organic solvents and halogenated hydrocarbons and their vapours, Unspecified Place
X47|Accidental poisoning by and exposure to other gases and vapours
X47.0|Accidental poisoning by and exposure to other gases and vapours, Home
X47.1|Accidental poisoning by and exposure to other gases and vapours, Residential Institution
X47.2|Accidental poisoning by and exposure to other gases and vapours, School, Other Institution and Public Admimistration Area
X47.3|Accidental poisoning by and exposure to other gases and vapours, Sports and Athletic Areas
X47.4|Accidental poisoning by and exposure to other gases and vapours, Street and Highway
X47.5|Accidental poisoning by and exposure to other gases and vapours, Trade and Service Area
X47.6|Accidental poisoning by and exposure to other gases and vapours, Industrial and Construction Area
X47.7|Accidental poisoning by and exposure to other gases and vapours, Farm
X47.8|Accidental poisoning by and exposure to other gases and vapours, Other Specified Area
X47.9|Accidental poisoning by and exposure to other gases and vapours, Unspecified Place
X48|Accidental poisoning by and exposure to pesticides
X48.0|Accidental poisoning by and exposure to pesticides, Home
X48.1|Accidental poisoning by and exposure to pesticides, Residential Institution
X48.2|Accidental poisoning by and exposure to pesticides, School, Other Institution and Public Admimistration Area
X48.3|Accidental poisoning by and exposure to pesticides, Sports and Athletic Areas
X48.4|Accidental poisoning by and exposure to pesticides, Street and Highway
X48.5|Accidental poisoning by and exposure to pesticides, Trade and Service Area
X48.6|Accidental poisoning by and exposure to pesticides, Industrial and Construction Area
X48.7|Accidental poisoning by and exposure to pesticides, Farm
X48.8|Accidental poisoning by and exposure to pesticides, Other Specified Area
X48.9|Accidental poisoning by and exposure to pesticides, Unspecified Place
X49|Accidental poisoning by and exposure to other and unspecified chemicals and noxious substances
X49.0|Accidental poisoning by and exposure to other and unspecified chemicals and noxious substances, Home
X49.1|Accidental poisoning by and exposure to other and unspecified chemicals and noxious substances, Residential Institution
X49.2|Accidental poisoning by and exposure to other and unspecified chemicals and noxious substances, School, Other Institution and Public Admimistration Area
X49.3|Accidental poisoning by and exposure to other and unspecified chemicals and noxious substances, Sports and Athletic Areas
X49.4|Accidental poisoning by and exposure to other and unspecified chemicals and noxious substances, Street and Highway
X49.5|Accidental poisoning by and exposure to other and unspecified chemicals and noxious substances, Trade and Service Area
X49.6|Accidental poisoning by and exposure to other and unspecified chemicals and noxious substances, Industrial and Construction Area
X49.7|Accidental poisoning by and exposure to other and unspecified chemicals and noxious substances, Farm
X49.8|Accidental poisoning by and exposure to other and unspecified chemicals and noxious substances, Other Specified Area
X49.9|Accidental poisoning by and exposure to other and unspecified chemicals and noxious substances, Unspecified Place
X50|Overexertion and strenuous or repetitive movements
X50.0|Overexertion and strenuous or repetitive movements, Home
X50.1|Overexertion and strenuous or repetitive movements, Residential Institution
X50.2|Overexertion and strenuous or repetitive movements, School, Other Institution and Public Admimistration Area
X50.3|Overexertion and strenuous or repetitive movements, Sports and Athletic Areas
X50.4|Overexertion and strenuous or repetitive movements, Street and Highway
X50.5|Overexertion and strenuous or repetitive movements, Trade and Service Area
X50.6|Overexertion and strenuous or repetitive movements, Industrial and Construction Area
X50.7|Overexertion and strenuous or repetitive movements, Farm
X50.8|Overexertion and strenuous or repetitive movements, Other Specified Area
X50.9|Overexertion and strenuous or repetitive movements, Unspecified Place
X51|Travel and motion
X51.0|Travel and motion, Home
X51.1|Travel and motion, Residential Institution
X51.2|Travel and motion, School, Other Institution and Public Admimistration Area
X51.3|Travel and motion, Sports and Athletic Areas
X51.4|Travel and motion, Street and Highway
X51.5|Travel and motion, Trade and Service Area
X51.6|Travel and motion, Industrial and Construction Area
X51.7|Travel and motion, Farm
X51.8|Travel and motion, Other Specified Area
X51.9|Travel and motion, Unspecified Place
X52|Prolonged stay in weightless environment
X52.0|Prolonged stay in weightless environment, Home
X52.1|Prolonged stay in weightless environment, Residential Institution
X52.2|Prolonged stay in weightless environment, School, Other Institution and Public Admimistration Area
X52.3|Prolonged stay in weightless environment, Sports and Athletic Areas
X52.4|Prolonged stay in weightless environment, Street and Highway
X52.5|Prolonged stay in weightless environment, Trade and Service Area
X52.6|Prolonged stay in weightless environment, Industrial and Construction Area
X52.7|Prolonged stay in weightless environment, Farm
X52.8|Prolonged stay in weightless environment, Other Specified Area
X52.9|Prolonged stay in weightless environment, Unspecified Place
X53|Lack of food
X53.0|Lack of food, Home
X53.1|Lack of food, Residential Institution
X53.2|Lack of food, School, Other Institution and Public Admimistration Area
X53.3|Lack of food, Sports and Athletic Areas
X53.4|Lack of food, Street and Highway
X53.5|Lack of food, Trade and Service Area
X53.6|Lack of food, Industrial and Construction Area
X53.7|Lack of food, Farm
X53.8|Lack of food, Other Specified Area
X53.9|Lack of food, Unspecified Place
X54|Lack of water
X54.0|Lack of water, Home
X54.1|Lack of water, Residential Institution
X54.2|Lack of water, School, Other Institution and Public Admimistration Area
X54.3|Lack of water, Sports and Athletic Areas
X54.4|Lack of water, Street and Highway
X54.5|Lack of water, Trade and Service Area
X54.6|Lack of water, Industrial and Construction Area
X54.7|Lack of water, Farm
X54.8|Lack of water, Other Specified Area
X54.9|Lack of water, Unspecified Place
X57|Unspecified privation
X57.0|Unspecified privation, Home
X57.1|Unspecified privation, Residential Institution
X57.2|Unspecified privation, School, Other Institution and Public Admimistration Area
X57.3|Unspecified privation, Sports and Athletic Areas
X57.4|Unspecified privation, Street and Highway
X57.5|Unspecified privation, Trade and Service Area
X57.6|Unspecified privation, Industrial and Construction Area
X57.7|Unspecified privation, Farm
X57.8|Unspecified privation, Other Specified Area
X57.9|Unspecified privation, Unspecified Place
X58|Exposure to other specified factors
X58.0|Exposure to other specified factors, Home
X58.1|Exposure to other specified factors, Residential Institution
X58.2|Exposure to other specified factors, School, Other Institution and Public Admimistration Area
X58.3|Exposure to other specified factors, Sports and Athletic Areas
X58.4|Exposure to other specified factors, Street and Highway
X58.5|Exposure to other specified factors, Trade and Service Area
X58.6|Exposure to other specified factors, Industrial and Construction Area
X58.7|Exposure to other specified factors, Farm
X58.8|Exposure to other specified factors, Other Specified Area
X58.9|Exposure to other specified factors, Unspecified Place
X59|Exposure to unspecified factor
X59.0|Exposure to unspecified factor, Home
X59.1|Exposure to unspecified factor, Residential Institution
X59.2|Exposure to unspecified factor, School, Other Institution and Public Admimistration Area
X59.3|Exposure to unspecified factor, Sports and Athletic Areas
X59.4|Exposure to unspecified factor, Street and Highway
X59.5|Exposure to unspecified factor, Trade and Service Area
X59.6|Exposure to unspecified factor, Industrial and Construction Area
X59.7|Exposure to unspecified factor, Farm
X59.8|Exposure to unspecified factor, Other Specified Area
X59.9|Exposure to unspecified factor, Unspecified Place
X60|Intentional self-poisoning by and exposure to nonopioid analgesics, antipyretics and antirheumatics
X60.0|Intentional self-poisoning by and exposure to nonopioid analgesics, antipyretics and antirheumatics, Home
X60.1|Intentional self-poisoning by and exposure to nonopioid analgesics, antipyretics and antirheumatics, Residential Institution
X60.2|Intentional self-poisoning by and exposure to nonopioid analgesics, antipyretics and antirheumatics, School, Other Institution and Public Admimistration Area
X60.3|Intentional self-poisoning by and exposure to nonopioid analgesics, antipyretics and antirheumatics, Sports and Athletic Areas
X60.4|Intentional self-poisoning by and exposure to nonopioid analgesics, antipyretics and antirheumatics, Street and Highway
X60.5|Intentional self-poisoning by and exposure to nonopioid analgesics, antipyretics and antirheumatics, Trade and Service Area
X60.6|Intentional self-poisoning by and exposure to nonopioid analgesics, antipyretics and antirheumatics, Industrial and Construction Area
X60.7|Intentional self-poisoning by and exposure to nonopioid analgesics, antipyretics and antirheumatics, Farm
X60.8|Intentional self-poisoning by and exposure to nonopioid analgesics, antipyretics and antirheumatics, Other Specified Area
X60.9|Intentional self-poisoning by and exposure to nonopioid analgesics, antipyretics and antirheumatics, Unspecified Place
X61|Intentional self-poisoning by and exposure to antiepileptic, sedative-hypnotic, antiparkinsonism and psychotropic drugs, not elsewhere classified
X61.0|Intentional self-poisoning by and exposure to antiepileptic, sedative-hypnotic, antiparkinsonism and psychotropic drugs, not elsewhere classified, Home
X61.1|Intentional self-poisoning by and exposure to antiepileptic, sedative-hypnotic, antiparkinsonism and psychotropic drugs, not elsewhere classified, Residential Institution
X61.2|Intentional self-poisoning by and exposure to antiepileptic, sedative-hypnotic, antiparkinsonism and psychotropic drugs, not elsewhere classified, School, Other Institution and Public Admimistration Area
X61.3|Intentional self-poisoning by and exposure to antiepileptic, sedative-hypnotic, antiparkinsonism and psychotropic drugs, not elsewhere classified, Sports and Athletic Areas
X61.4|Intentional self-poisoning by and exposure to antiepileptic, sedative-hypnotic, antiparkinsonism and psychotropic drugs, not elsewhere classified, Street and Highway
X61.5|Intentional self-poisoning by and exposure to antiepileptic, sedative-hypnotic, antiparkinsonism and psychotropic drugs, not elsewhere classified, Trade and Service Area
X61.6|Intentional self-poisoning by and exposure to antiepileptic, sedative-hypnotic, antiparkinsonism and psychotropic drugs, not elsewhere classified, Industrial and Construction Area
X61.7|Intentional self-poisoning by and exposure to antiepileptic, sedative-hypnotic, antiparkinsonism and psychotropic drugs, not elsewhere classified, Farm
X61.8|Intentional self-poisoning by and exposure to antiepileptic, sedative-hypnotic, antiparkinsonism and psychotropic drugs, not elsewhere classified, Other Specified Area
X61.9|Intentional self-poisoning by and exposure to antiepileptic, sedative-hypnotic, antiparkinsonism and psychotropic drugs, not elsewhere classified, Unspecified Place
X62|Intentional self-poisoning by and exposure to narcotics and psychodysleptics [hallucinogens], not elsewhere classified
X62.0|Intentional self-poisoning by and exposure to narcotics and psychodysleptics [hallucinogens], not elsewhere classified, Home
X62.1|Intentional self-poisoning by and exposure to narcotics and psychodysleptics [hallucinogens], not elsewhere classified, Residential Institution
X62.2|Intentional self-poisoning by and exposure to narcotics and psychodysleptics [hallucinogens], not elsewhere classified, School, Other Institution and Public Admimistration Area
X62.3|Intentional self-poisoning by and exposure to narcotics and psychodysleptics [hallucinogens], not elsewhere classified, Sports and Athletic Areas
X62.4|Intentional self-poisoning by and exposure to narcotics and psychodysleptics [hallucinogens], not elsewhere classified, Street and Highway
X62.5|Intentional self-poisoning by and exposure to narcotics and psychodysleptics [hallucinogens], not elsewhere classified, Trade and Service Area
X62.6|Intentional self-poisoning by and exposure to narcotics and psychodysleptics [hallucinogens], not elsewhere classified, Industrial and Construction Area
X62.7|Intentional self-poisoning by and exposure to narcotics and psychodysleptics [hallucinogens], not elsewhere classified, Farm
X62.8|Intentional self-poisoning by and exposure to narcotics and psychodysleptics [hallucinogens], not elsewhere classified, Other Specified Area
X62.9|Intentional self-poisoning by and exposure to narcotics and psychodysleptics [hallucinogens], not elsewhere classified, Unspecified Place
X63|Intentional self-poisoning by and exposure to other drugs acting on the autonomic nervous system
X63.0|Intentional self-poisoning by and exposure to other drugs acting on the autonomic nervous system, Home
X63.1|Intentional self-poisoning by and exposure to other drugs acting on the autonomic nervous system, Residential Institution
X63.2|Intentional self-poisoning by and exposure to other drugs acting on the autonomic nervous system, School, Other Institution and Public Admimistration Area
X63.3|Intentional self-poisoning by and exposure to other drugs acting on the autonomic nervous system, Sports and Athletic Areas
X63.4|Intentional self-poisoning by and exposure to other drugs acting on the autonomic nervous system, Street and Highway
X63.5|Intentional self-poisoning by and exposure to other drugs acting on the autonomic nervous system, Trade and Service Area
X63.6|Intentional self-poisoning by and exposure to other drugs acting on the autonomic nervous system, Industrial and Construction Area
X63.7|Intentional self-poisoning by and exposure to other drugs acting on the autonomic nervous system, Farm
X63.8|Intentional self-poisoning by and exposure to other drugs acting on the autonomic nervous system, Other Specified Area
X63.9|Intentional self-poisoning by and exposure to other drugs acting on the autonomic nervous system, Unspecified Place
X64|Intentional self-poisoning by and exposure to other and unspecified drugs, medicaments and biological substances
X64.0|Intentional self-poisoning by and exposure to other and unspecified drugs, medicaments and biological substances, Home
X64.1|Intentional self-poisoning by and exposure to other and unspecified drugs, medicaments and biological substances, Residential Institution
X64.2|Intentional self-poisoning by and exposure to other and unspecified drugs, medicaments and biological substances, School, Other Institution and Public Admimistration Area
X64.3|Intentional self-poisoning by and exposure to other and unspecified drugs, medicaments and biological substances, Sports and Athletic Areas
X64.4|Intentional self-poisoning by and exposure to other and unspecified drugs, medicaments and biological substances, Street and Highway
X64.5|Intentional self-poisoning by and exposure to other and unspecified drugs, medicaments and biological substances, Trade and Service Area
X64.6|Intentional self-poisoning by and exposure to other and unspecified drugs, medicaments and biological substances, Industrial and Construction Area
X64.7|Intentional self-poisoning by and exposure to other and unspecified drugs, medicaments and biological substances, Farm
X64.8|Intentional self-poisoning by and exposure to other and unspecified drugs, medicaments and biological substances, Other Specified Area
X64.9|Intentional self-poisoning by and exposure to other and unspecified drugs, medicaments and biological substances, Unspecified Place
X65|Intentional self-poisoning by and exposure to alcohol
X65.0|Intentional self-poisoning by and exposure to alcohol, Home
X65.1|Intentional self-poisoning by and exposure to alcohol, Residential Institution
X65.2|Intentional self-poisoning by and exposure to alcohol, School, Other Institution and Public Admimistration Area
X65.3|Intentional self-poisoning by and exposure to alcohol, Sports and Athletic Areas
X65.4|Intentional self-poisoning by and exposure to alcohol, Street and Highway
X65.5|Intentional self-poisoning by and exposure to alcohol, Trade and Service Area
X65.6|Intentional self-poisoning by and exposure to alcohol, Industrial and Construction Area
X65.7|Intentional self-poisoning by and exposure to alcohol, Farm
X65.8|Intentional self-poisoning by and exposure to alcohol, Other Specified Area
X65.9|Intentional self-poisoning by and exposure to alcohol, Unspecified Place
X66|Intentional self-poisoning by and exposure to organic solvents and halogenated hydrocarbons and their vapours
X66.0|Intentional self-poisoning by and exposure to organic solvents and halogenated hydrocarbons and their vapours, Home
X66.1|Intentional self-poisoning by and exposure to organic solvents and halogenated hydrocarbons and their vapours, Residential Institution
X66.2|Intentional self-poisoning by and exposure to organic solvents and halogenated hydrocarbons and their vapours, School, Other Institution and Public Admimistration Area
X66.3|Intentional self-poisoning by and exposure to organic solvents and halogenated hydrocarbons and their vapours, Sports and Athletic Areas
X66.4|Intentional self-poisoning by and exposure to organic solvents and halogenated hydrocarbons and their vapours, Street and Highway
X66.5|Intentional self-poisoning by and exposure to organic solvents and halogenated hydrocarbons and their vapours, Trade and Service Area
X66.6|Intentional self-poisoning by and exposure to organic solvents and halogenated hydrocarbons and their vapours, Industrial and Construction Area
X66.7|Intentional self-poisoning by and exposure to organic solvents and halogenated hydrocarbons and their vapours, Farm
X66.8|Intentional self-poisoning by and exposure to organic solvents and halogenated hydrocarbons and their vapours, Other Specified Area
X66.9|Intentional self-poisoning by and exposure to organic solvents and halogenated hydrocarbons and their vapours, Unspecified Place
X67|Intentional self-poisoning by and exposure to other gases and vapours
X67.0|Intentional self-poisoning by and exposure to other gases and vapours, Home
X67.1|Intentional self-poisoning by and exposure to other gases and vapours, Residential Institution
X67.2|Intentional self-poisoning by and exposure to other gases and vapours, School, Other Institution and Public Admimistration Area
X67.3|Intentional self-poisoning by and exposure to other gases and vapours, Sports and Athletic Areas
X67.4|Intentional self-poisoning by and exposure to other gases and vapours, Street and Highway
X67.5|Intentional self-poisoning by and exposure to other gases and vapours, Trade and Service Area
X67.6|Intentional self-poisoning by and exposure to other gases and vapours, Industrial and Construction Area
X67.7|Intentional self-poisoning by and exposure to other gases and vapours, Farm
X67.8|Intentional self-poisoning by and exposure to other gases and vapours, Other Specified Area
X67.9|Intentional self-poisoning by and exposure to other gases and vapours, Unspecified Place
X68|Intentional self-poisoning by and exposure to pesticides
X68.0|Intentional self-poisoning by and exposure to pesticides, Home
X68.1|Intentional self-poisoning by and exposure to pesticides, Residential Institution
X68.2|Intentional self-poisoning by and exposure to pesticides, School, Other Institution and Public Admimistration Area
X68.3|Intentional self-poisoning by and exposure to pesticides, Sports and Athletic Areas
X68.4|Intentional self-poisoning by and exposure to pesticides, Street and Highway
X68.5|Intentional self-poisoning by and exposure to pesticides, Trade and Service Area
X68.6|Intentional self-poisoning by and exposure to pesticides, Industrial and Construction Area
X68.7|Intentional self-poisoning by and exposure to pesticides, Farm
X68.8|Intentional self-poisoning by and exposure to pesticides, Other Specified Area
X68.9|Intentional self-poisoning by and exposure to pesticides, Unspecified Place
X69|Intentional self-poisoning by and exposure to other and unspecified chemicals and noxious substances
X69.0|Intentional self-poisoning by and exposure to other and unspecified chemicals and noxious substances, Home
X69.1|Intentional self-poisoning by and exposure to other and unspecified chemicals and noxious substances, Residential Institution
X69.2|Intentional self-poisoning by and exposure to other and unspecified chemicals and noxious substances, School, Other Institution and Public Admimistration Area
X69.3|Intentional self-poisoning by and exposure to other and unspecified chemicals and noxious substances, Sports and Athletic Areas
X69.4|Intentional self-poisoning by and exposure to other and unspecified chemicals and noxious substances, Street and Highway
X69.5|Intentional self-poisoning by and exposure to other and unspecified chemicals and noxious substances, Trade and Service Area
X69.6|Intentional self-poisoning by and exposure to other and unspecified chemicals and noxious substances, Industrial and Construction Area
X69.7|Intentional self-poisoning by and exposure to other and unspecified chemicals and noxious substances, Farm
X69.8|Intentional self-poisoning by and exposure to other and unspecified chemicals and noxious substances, Other Specified Area
X69.9|Intentional self-poisoning by and exposure to other and unspecified chemicals and noxious substances, Unspecified Place
X70|Intentional self-harm by hanging, strangulation and suffocation
X70.0|Intentional self-harm by hanging, strangulation and suffocation, Home
X70.1|Intentional self-harm by hanging, strangulation and suffocation, Residential Institution
X70.2|Intentional self-harm by hanging, strangulation and suffocation, School, Other Institution and Public Admimistration Area
X70.3|Intentional self-harm by hanging, strangulation and suffocation, Sports and Athletic Areas
X70.4|Intentional self-harm by hanging, strangulation and suffocation, Street and Highway
X70.5|Intentional self-harm by hanging, strangulation and suffocation, Trade and Service Area
X70.6|Intentional self-harm by hanging, strangulation and suffocation, Industrial and Construction Area
X70.7|Intentional self-harm by hanging, strangulation and suffocation, Farm
X70.8|Intentional self-harm by hanging, strangulation and suffocation, Other Specified Area
X70.9|Intentional self-harm by hanging, strangulation and suffocation, Unspecified Place
X71|Intentional self-harm by drowning and submersion
X71.0|Intentional self-harm by drowning and submersion, Home
X71.1|Intentional self-harm by drowning and submersion, Residential Institution
X71.2|Intentional self-harm by drowning and submersion, School, Other Institution and Public Admimistration Area
X71.3|Intentional self-harm by drowning and submersion, Sports and Athletic Areas
X71.4|Intentional self-harm by drowning and submersion, Street and Highway
X71.5|Intentional self-harm by drowning and submersion, Trade and Service Area
X71.6|Intentional self-harm by drowning and submersion, Industrial and Construction Area
X71.7|Intentional self-harm by drowning and submersion, Farm
X71.8|Intentional self-harm by drowning and submersion, Other Specified Area
X71.9|Intentional self-harm by drowning and submersion, Unspecified Place
X72|Intentional self-harm by handgun discharge
X72.0|Intentional self-harm by handgun discharge, Home
X72.1|Intentional self-harm by handgun discharge, Residential Institution
X72.2|Intentional self-harm by handgun discharge, School, Other Institution and Public Admimistration Area
X72.3|Intentional self-harm by handgun discharge, Sports and Athletic Areas
X72.4|Intentional self-harm by handgun discharge, Street and Highway
X72.5|Intentional self-harm by handgun discharge, Trade and Service Area
X72.6|Intentional self-harm by handgun discharge, Industrial and Construction Area
X72.7|Intentional self-harm by handgun discharge, Farm
X72.8|Intentional self-harm by handgun discharge, Other Specified Area
X72.9|Intentional self-harm by handgun discharge, Unspecified Place
X73|Intentional self-harm by rifle, shotgun and larger firearm discharge
X73.0|Intentional self-harm by rifle, shotgun and larger firearm discharge, Home
X73.1|Intentional self-harm by rifle, shotgun and larger firearm discharge, Residential Institution
X73.2|Intentional self-harm by rifle, shotgun and larger firearm discharge, School, Other Institution and Public Admimistration Area
X73.3|Intentional self-harm by rifle, shotgun and larger firearm discharge, Sports and Athletic Areas
X73.4|Intentional self-harm by rifle, shotgun and larger firearm discharge, Street and Highway
X73.5|Intentional self-harm by rifle, shotgun and larger firearm discharge, Trade and Service Area
X73.6|Intentional self-harm by rifle, shotgun and larger firearm discharge, Industrial and Construction Area
X73.7|Intentional self-harm by rifle, shotgun and larger firearm discharge, Farm
X73.8|Intentional self-harm by rifle, shotgun and larger firearm discharge, Other Specified Area
X73.9|Intentional self-harm by rifle, shotgun and larger firearm discharge, Unspecified Place
X74|Intentional self-harm by other and unspecified firearm discharge
X74.0|Intentional self-harm by other and unspecified firearm discharge, Home
X74.1|Intentional self-harm by other and unspecified firearm discharge, Residential Institution
X74.2|Intentional self-harm by other and unspecified firearm discharge, School, Other Institution and Public Admimistration Area
X74.3|Intentional self-harm by other and unspecified firearm discharge, Sports and Athletic Areas
X74.4|Intentional self-harm by other and unspecified firearm discharge, Street and Highway
X74.5|Intentional self-harm by other and unspecified firearm discharge, Trade and Service Area
X74.6|Intentional self-harm by other and unspecified firearm discharge, Industrial and Construction Area
X74.7|Intentional self-harm by other and unspecified firearm discharge, Farm
X74.8|Intentional self-harm by other and unspecified firearm discharge, Other Specified Area
X74.9|Intentional self-harm by other and unspecified firearm discharge, Unspecified Place
X75|Intentional self-harm by explosive material
X75.0|Intentional self-harm by explosive material, Home
X75.1|Intentional self-harm by explosive material, Residential Institution
X75.2|Intentional self-harm by explosive material, School, Other Institution and Public Admimistration Area
X75.3|Intentional self-harm by explosive material, Sports and Athletic Areas
X75.4|Intentional self-harm by explosive material, Street and Highway
X75.5|Intentional self-harm by explosive material, Trade and Service Area
X75.6|Intentional self-harm by explosive material, Industrial and Construction Area
X75.7|Intentional self-harm by explosive material, Farm
X75.8|Intentional self-harm by explosive material, Other Specified Area
X75.9|Intentional self-harm by explosive material, Unspecified Place
X76|Intentional self-harm by smoke, fire and flames
X76.0|Intentional self-harm by smoke, fire and flames, Home
X76.1|Intentional self-harm by smoke, fire and flames, Residential Institution
X76.2|Intentional self-harm by smoke, fire and flames, School, Other Institution and Public Admimistration Area
X76.3|Intentional self-harm by smoke, fire and flames, Sports and Athletic Areas
X76.4|Intentional self-harm by smoke, fire and flames, Street and Highway
X76.5|Intentional self-harm by smoke, fire and flames, Trade and Service Area
X76.6|Intentional self-harm by smoke, fire and flames, Industrial and Construction Area
X76.7|Intentional self-harm by smoke, fire and flames, Farm
X76.8|Intentional self-harm by smoke, fire and flames, Other Specified Area
X76.9|Intentional self-harm by smoke, fire and flames, Unspecified Place
X77|Intentional self-harm by steam, hot vapours and hot objects
X77.0|Intentional self-harm by steam, hot vapours and hot objects, Home
X77.1|Intentional self-harm by steam, hot vapours and hot objects, Residential Institution
X77.2|Intentional self-harm by steam, hot vapours and hot objects, School, Other Institution and Public Admimistration Area
X77.3|Intentional self-harm by steam, hot vapours and hot objects, Sports and Athletic Areas
X77.4|Intentional self-harm by steam, hot vapours and hot objects, Street and Highway
X77.5|Intentional self-harm by steam, hot vapours and hot objects, Trade and Service Area
X77.6|Intentional self-harm by steam, hot vapours and hot objects, Industrial and Construction Area
X77.7|Intentional self-harm by steam, hot vapours and hot objects, Farm
X77.8|Intentional self-harm by steam, hot vapours and hot objects, Other Specified Area
X77.9|Intentional self-harm by steam, hot vapours and hot objects, Unspecified Place
X78|Intentional self-harm by sharp object
X78.0|Intentional self-harm by sharp object, Home
X78.1|Intentional self-harm by sharp object, Residential Institution
X78.2|Intentional self-harm by sharp object, School, Other Institution and Public Admimistration Area
X78.3|Intentional self-harm by sharp object, Sports and Athletic Areas
X78.4|Intentional self-harm by sharp object, Street and Highway
X78.5|Intentional self-harm by sharp object, Trade and Service Area
X78.6|Intentional self-harm by sharp object, Industrial and Construction Area
X78.7|Intentional self-harm by sharp object, Farm
X78.8|Intentional self-harm by sharp object, Other Specified Area
X78.9|Intentional self-harm by sharp object, Unspecified Place
X79|Intentional self-harm by blunt object
X79.0|Intentional self-harm by blunt object, Home
X79.1|Intentional self-harm by blunt object, Residential Institution
X79.2|Intentional self-harm by blunt object, School, Other Institution and Public Admimistration Area
X79.3|Intentional self-harm by blunt object, Sports and Athletic Areas
X79.4|Intentional self-harm by blunt object, Street and Highway
X79.5|Intentional self-harm by blunt object, Trade and Service Area
X79.6|Intentional self-harm by blunt object, Industrial and Construction Area
X79.7|Intentional self-harm by blunt object, Farm
X79.8|Intentional self-harm by blunt object, Other Specified Area
X79.9|Intentional self-harm by blunt object, Unspecified Place
X80|Intentional self-harm by jumping from a high place
X80.0|Intentional self-harm by jumping from a high place, Home
X80.1|Intentional self-harm by jumping from a high place, Residential Institution
X80.2|Intentional self-harm by jumping from a high place, School, Other Institution and Public Admimistration Area
X80.3|Intentional self-harm by jumping from a high place, Sports and Athletic Areas
X80.4|Intentional self-harm by jumping from a high place, Street and Highway
X80.5|Intentional self-harm by jumping from a high place, Trade and Service Area
X80.6|Intentional self-harm by jumping from a high place, Industrial and Construction Area
X80.7|Intentional self-harm by jumping from a high place, Farm
X80.8|Intentional self-harm by jumping from a high place, Other Specified Area
X80.9|Intentional self-harm by jumping from a high place, Unspecified Place
X81|Intentional self-harm by jumping or lying before moving object
X81.0|Intentional self-harm by jumping or lying before moving object, Home
X81.1|Intentional self-harm by jumping or lying before moving object, Residential Institution
X81.2|Intentional self-harm by jumping or lying before moving object, School, Other Institution and Public Admimistration Area
X81.3|Intentional self-harm by jumping or lying before moving object, Sports and Athletic Areas
X81.4|Intentional self-harm by jumping or lying before moving object, Street and Highway
X81.5|Intentional self-harm by jumping or lying before moving object, Trade and Service Area
X81.6|Intentional self-harm by jumping or lying before moving object, Industrial and Construction Area
X81.7|Intentional self-harm by jumping or lying before moving object, Farm
X81.8|Intentional self-harm by jumping or lying before moving object, Other Specified Area
X81.9|Intentional self-harm by jumping or lying before moving object, Unspecified Place
X82|Intentional self-harm by crashing of motor vehicle
X82.0|Intentional self-harm by crashing of motor vehicle, Home
X82.1|Intentional self-harm by crashing of motor vehicle, Residential Institution
X82.2|Intentional self-harm by crashing of motor vehicle, School, Other Institution and Public Admimistration Area
X82.3|Intentional self-harm by crashing of motor vehicle, Sports and Athletic Areas
X82.4|Intentional self-harm by crashing of motor vehicle, Street and Highway
X82.5|Intentional self-harm by crashing of motor vehicle, Trade and Service Area
X82.6|Intentional self-harm by crashing of motor vehicle, Industrial and Construction Area
X82.7|Intentional self-harm by crashing of motor vehicle, Farm
X82.8|Intentional self-harm by crashing of motor vehicle, Other Specified Area
X82.9|Intentional self-harm by crashing of motor vehicle, Unspecified Place
X83|Intentional self-harm by other specified means
X83.0|Intentional self-harm by other specified means, Home
X83.1|Intentional self-harm by other specified means, Residential Institution
X83.2|Intentional self-harm by other specified means, School, Other Institution and Public Admimistration Area
X83.3|Intentional self-harm by other specified means, Sports and Athletic Areas
X83.4|Intentional self-harm by other specified means, Street and Highway
X83.5|Intentional self-harm by other specified means, Trade and Service Area
X83.6|Intentional self-harm by other specified means, Industrial and Construction Area
X83.7|Intentional self-harm by other specified means, Farm
X83.8|Intentional self-harm by other specified means, Other Specified Area
X83.9|Intentional self-harm by other specified means, Unspecified Place
X84|Intentional self-harm by unspecified means
X84.0|Intentional self-harm by unspecified means, Home
X84.1|Intentional self-harm by unspecified means, Residential Institution
X84.2|Intentional self-harm by unspecified means, School, Other Institution and Public Admimistration Area
X84.3|Intentional self-harm by unspecified means, Sports and Athletic Areas
X84.4|Intentional self-harm by unspecified means, Street and Highway
X84.5|Intentional self-harm by unspecified means, Trade and Service Area
X84.6|Intentional self-harm by unspecified means, Industrial and Construction Area
X84.7|Intentional self-harm by unspecified means, Farm
X84.8|Intentional self-harm by unspecified means, Other Specified Area
X84.9|Intentional self-harm by unspecified means, Unspecified Place
X85|Assault by drugs, medicaments and biological substances
X85.0|Assault by drugs, medicaments and biological substances, Home
X85.1|Assault by drugs, medicaments and biological substances, Residential Institution
X85.2|Assault by drugs, medicaments and biological substances, School, Other Institution and Public Admimistration Area
X85.3|Assault by drugs, medicaments and biological substances, Sports and Athletic Areas
X85.4|Assault by drugs, medicaments and biological substances, Street and Highway
X85.5|Assault by drugs, medicaments and biological substances, Trade and Service Area
X85.6|Assault by drugs, medicaments and biological substances, Industrial and Construction Area
X85.7|Assault by drugs, medicaments and biological substances, Farm
X85.8|Assault by drugs, medicaments and biological substances, Other Specified Area
X85.9|Assault by drugs, medicaments and biological substances, Unspecified Place
X86|Assault by corrosive substance
X86.0|Assault by corrosive substance, Home
X86.1|Assault by corrosive substance, Residential Institution
X86.2|Assault by corrosive substance, School, Other Institution and Public Admimistration Area
X86.3|Assault by corrosive substance, Sports and Athletic Areas
X86.4|Assault by corrosive substance, Street and Highway
X86.5|Assault by corrosive substance, Trade and Service Area
X86.6|Assault by corrosive substance, Industrial and Construction Area
X86.7|Assault by corrosive substance, Farm
X86.8|Assault by corrosive substance, Other Specified Area
X86.9|Assault by corrosive substance, Unspecified Place
X87|Assault by pesticides
X87.0|Assault by pesticides, Home
X87.1|Assault by pesticides, Residential Institution
X87.2|Assault by pesticides, School, Other Institution and Public Admimistration Area
X87.3|Assault by pesticides, Sports and Athletic Areas
X87.4|Assault by pesticides, Street and Highway
X87.5|Assault by pesticides, Trade and Service Area
X87.6|Assault by pesticides, Industrial and Construction Area
X87.7|Assault by pesticides, Farm
X87.8|Assault by pesticides, Other Specified Area
X87.9|Assault by pesticides, Unspecified Place
X88|Assault by gases and vapours
X88.0|Assault by gases and vapours, Home
X88.1|Assault by gases and vapours, Residential Institution
X88.2|Assault by gases and vapours, School, Other Institution and Public Admimistration Area
X88.3|Assault by gases and vapours, Sports and Athletic Areas
X88.4|Assault by gases and vapours, Street and Highway
X88.5|Assault by gases and vapours, Trade and Service Area
X88.6|Assault by gases and vapours, Industrial and Construction Area
X88.7|Assault by gases and vapours, Farm
X88.8|Assault by gases and vapours, Other Specified Area
X88.9|Assault by gases and vapours, Unspecified Place
X89|Assault by other specified chemicals and noxious substances
X89.0|Assault by other specified chemicals and noxious substances, Home
X89.1|Assault by other specified chemicals and noxious substances, Residential Institution
X89.2|Assault by other specified chemicals and noxious substances, School, Other Institution and Public Admimistration Area
X89.3|Assault by other specified chemicals and noxious substances, Sports and Athletic Areas
X89.4|Assault by other specified chemicals and noxious substances, Street and Highway
X89.5|Assault by other specified chemicals and noxious substances, Trade and Service Area
X89.6|Assault by other specified chemicals and noxious substances, Industrial and Construction Area
X89.7|Assault by other specified chemicals and noxious substances, Farm
X89.8|Assault by other specified chemicals and noxious substances, Other Specified Area
X89.9|Assault by other specified chemicals and noxious substances, Unspecified Place
X90|Assault by unspecified chemical or noxious substance
X90.0|Assault by unspecified chemical or noxious substance, Home
X90.1|Assault by unspecified chemical or noxious substance, Residential Institution
X90.2|Assault by unspecified chemical or noxious substance, School, Other Institution and Public Admimistration Area
X90.3|Assault by unspecified chemical or noxious substance, Sports and Athletic Areas
X90.4|Assault by unspecified chemical or noxious substance, Street and Highway
X90.5|Assault by unspecified chemical or noxious substance, Trade and Service Area
X90.6|Assault by unspecified chemical or noxious substance, Industrial and Construction Area
X90.7|Assault by unspecified chemical or noxious substance, Farm
X90.8|Assault by unspecified chemical or noxious substance, Other Specified Area
X90.9|Assault by unspecified chemical or noxious substance, Unspecified Place
X91|Assault by hanging, strangulation and suffocation
X91.0|Assault by hanging, strangulation and suffocation, Home
X91.1|Assault by hanging, strangulation and suffocation, Residential Institution
X91.2|Assault by hanging, strangulation and suffocation, School, Other Institution and Public Admimistration Area
X91.3|Assault by hanging, strangulation and suffocation, Sports and Athletic Areas
X91.4|Assault by hanging, strangulation and suffocation, Street and Highway
X91.5|Assault by hanging, strangulation and suffocation, Trade and Service Area
X91.6|Assault by hanging, strangulation and suffocation, Industrial and Construction Area
X91.7|Assault by hanging, strangulation and suffocation, Farm
X91.8|Assault by hanging, strangulation and suffocation, Other Specified Area
X91.9|Assault by hanging, strangulation and suffocation, Unspecified Place
X92|Assault by drowning and submersion
X92.0|Assault by drowning and submersion, Home
X92.1|Assault by drowning and submersion, Residential Institution
X92.2|Assault by drowning and submersion, School, Other Institution and Public Admimistration Area
X92.3|Assault by drowning and submersion, Sports and Athletic Areas
X92.4|Assault by drowning and submersion, Street and Highway
X92.5|Assault by drowning and submersion, Trade and Service Area
X92.6|Assault by drowning and submersion, Industrial and Construction Area
X92.7|Assault by drowning and submersion, Farm
X92.8|Assault by drowning and submersion, Other Specified Area
X92.9|Assault by drowning and submersion, Unspecified Place
X93|Assault by handgun discharge
X93.0|Assault by handgun discharge, Home
X93.1|Assault by handgun discharge, Residential Institution
X93.2|Assault by handgun discharge, School, Other Institution and Public Admimistration Area
X93.3|Assault by handgun discharge, Sports and Athletic Areas
X93.4|Assault by handgun discharge, Street and Highway
X93.5|Assault by handgun discharge, Trade and Service Area
X93.6|Assault by handgun discharge, Industrial and Construction Area
X93.7|Assault by handgun discharge, Farm
X93.8|Assault by handgun discharge, Other Specified Area
X93.9|Assault by handgun discharge, Unspecified Place
X94|Assault by rifle, shotgun and larger firearm discharge
X94.0|Assault by rifle, shotgun and larger firearm discharge, Home
X94.1|Assault by rifle, shotgun and larger firearm discharge, Residential Institution
X94.2|Assault by rifle, shotgun and larger firearm discharge, School, Other Institution and Public Admimistration Area
X94.3|Assault by rifle, shotgun and larger firearm discharge, Sports and Athletic Areas
X94.4|Assault by rifle, shotgun and larger firearm discharge, Street and Highway
X94.5|Assault by rifle, shotgun and larger firearm discharge, Trade and Service Area
X94.6|Assault by rifle, shotgun and larger firearm discharge, Industrial and Construction Area
X94.7|Assault by rifle, shotgun and larger firearm discharge, Farm
X94.8|Assault by rifle, shotgun and larger firearm discharge, Other Specified Area
X94.9|Assault by rifle, shotgun and larger firearm discharge, Unspecified Place
X95|Assault by other and unspecified firearm discharge
X95.0|Assault by other and unspecified firearm discharge, Home
X95.1|Assault by other and unspecified firearm discharge, Residential Institution
X95.2|Assault by other and unspecified firearm discharge, School, Other Institution and Public Admimistration Area
X95.3|Assault by other and unspecified firearm discharge, Sports and Athletic Areas
X95.4|Assault by other and unspecified firearm discharge, Street and Highway
X95.5|Assault by other and unspecified firearm discharge, Trade and Service Area
X95.6|Assault by other and unspecified firearm discharge, Industrial and Construction Area
X95.7|Assault by other and unspecified firearm discharge, Farm
X95.8|Assault by other and unspecified firearm discharge, Other Specified Area
X95.9|Assault by other and unspecified firearm discharge, Unspecified Place
X96|Assault by explosive material
X96.0|Assault by explosive material, Home
X96.1|Assault by explosive material, Residential Institution
X96.2|Assault by explosive material, School, Other Institution and Public Admimistration Area
X96.3|Assault by explosive material, Sports and Athletic Areas
X96.4|Assault by explosive material, Street and Highway
X96.5|Assault by explosive material, Trade and Service Area
X96.6|Assault by explosive material, Industrial and Construction Area
X96.7|Assault by explosive material, Farm
X96.8|Assault by explosive material, Other Specified Area
X96.9|Assault by explosive material, Unspecified Place
X97|Assault by smoke, fire and flames
X97.0|Assault by smoke, fire and flames, Home
X97.1|Assault by smoke, fire and flames, Residential Institution
X97.2|Assault by smoke, fire and flames, School, Other Institution and Public Admimistration Area
X97.3|Assault by smoke, fire and flames, Sports and Athletic Areas
X97.4|Assault by smoke, fire and flames, Street and Highway
X97.5|Assault by smoke, fire and flames, Trade and Service Area
X97.6|Assault by smoke, fire and flames, Industrial and Construction Area
X97.7|Assault by smoke, fire and flames, Farm
X97.8|Assault by smoke, fire and flames, Other Specified Area
X97.9|Assault by smoke, fire and flames, Unspecified Place
X98|Assault by steam, hot vapours and hot objects
X98.0|Assault by steam, hot vapours and hot objects, Home
X98.1|Assault by steam, hot vapours and hot objects, Residential Institution
X98.2|Assault by steam, hot vapours and hot objects, School, Other Institution and Public Admimistration Area
X98.3|Assault by steam, hot vapours and hot objects, Sports and Athletic Areas
X98.4|Assault by steam, hot vapours and hot objects, Street and Highway
X98.5|Assault by steam, hot vapours and hot objects, Trade and Service Area
X98.6|Assault by steam, hot vapours and hot objects, Industrial and Construction Area
X98.7|Assault by steam, hot vapours and hot objects, Farm
X98.8|Assault by steam, hot vapours and hot objects, Other Specified Area
X98.9|Assault by steam, hot vapours and hot objects, Unspecified Place
X99|Assault by sharp object
X99.0|Assault by sharp object, Home
X99.1|Assault by sharp object, Residential Institution
X99.2|Assault by sharp object, School, Other Institution and Public Admimistration Area
X99.3|Assault by sharp object, Sports and Athletic Areas
X99.4|Assault by sharp object, Street and Highway
X99.5|Assault by sharp object, Trade and Service Area
X99.6|Assault by sharp object, Industrial and Construction Area
X99.7|Assault by sharp object, Farm
X99.8|Assault by sharp object, Other Specified Area
X99.9|Assault by sharp object, Unspecified Place
Y00|Assault by blunt object
Y00.0|Assault by blunt object, Home
Y00.1|Assault by blunt object, Residential Institution
Y00.2|Assault by blunt object, School, Other Institution and Public Admimistration Area
Y00.3|Assault by blunt object, Sports and Athletic Areas
Y00.4|Assault by blunt object, Street and Highway
Y00.5|Assault by blunt object, Trade and Service Area
Y00.6|Assault by blunt object, Industrial and Construction Area
Y00.7|Assault by blunt object, Farm
Y00.8|Assault by blunt object, Other Specified Area
Y00.9|Assault by blunt object, Unspecified Place
Y01|Assault by pushing from high place
Y01.0|Assault by pushing from high place, Home
Y01.1|Assault by pushing from high place, Residential Institution
Y01.2|Assault by pushing from high place, School, Other Institution and Public Admimistration Area
Y01.3|Assault by pushing from high place, Sports and Athletic Areas
Y01.4|Assault by pushing from high place, Street and Highway
Y01.5|Assault by pushing from high place, Trade and Service Area
Y01.6|Assault by pushing from high place, Industrial and Construction Area
Y01.7|Assault by pushing from high place, Farm
Y01.8|Assault by pushing from high place, Other Specified Area
Y01.9|Assault by pushing from high place, Unspecified Place
Y02|Assault by pushing or placing victim before moving object
Y02.0|Assault by pushing or placing victim before moving object, Home
Y02.1|Assault by pushing or placing victim before moving object, Residential Institution
Y02.2|Assault by pushing or placing victim before moving object, School, Other Institution and Public Admimistration Area
Y02.3|Assault by pushing or placing victim before moving object, Sports and Athletic Areas
Y02.4|Assault by pushing or placing victim before moving object, Street and Highway
Y02.5|Assault by pushing or placing victim before moving object, Trade and Service Area
Y02.6|Assault by pushing or placing victim before moving object, Industrial and Construction Area
Y02.7|Assault by pushing or placing victim before moving object, Farm
Y02.8|Assault by pushing or placing victim before moving object, Other Specified Area
Y02.9|Assault by pushing or placing victim before moving object, Unspecified Place
Y03|Assault by crashing of motor vehicle
Y03.0|Assault by crashing of motor vehicle, Home
Y03.1|Assault by crashing of motor vehicle, Residential Institution
Y03.2|Assault by crashing of motor vehicle, School, Other Institution and Public Admimistration Area
Y03.3|Assault by crashing of motor vehicle, Sports and Athletic Areas
Y03.4|Assault by crashing of motor vehicle, Street and Highway
Y03.5|Assault by crashing of motor vehicle, Trade and Service Area
Y03.6|Assault by crashing of motor vehicle, Industrial and Construction Area
Y03.7|Assault by crashing of motor vehicle, Farm
Y03.8|Assault by crashing of motor vehicle, Other Specified Area
Y03.9|Assault by crashing of motor vehicle, Unspecified Place
Y04|Assault by bodily force
Y04.0|Assault by bodily force, Home
Y04.1|Assault by bodily force, Residential Institution
Y04.2|Assault by bodily force, School, Other Institution and Public Admimistration Area
Y04.3|Assault by bodily force, Sports and Athletic Areas
Y04.4|Assault by bodily force, Street and Highway
Y04.5|Assault by bodily force, Trade and Service Area
Y04.6|Assault by bodily force, Industrial and Construction Area
Y04.7|Assault by bodily force, Farm
Y04.8|Assault by bodily force, Other Specified Area
Y04.9|Assault by bodily force, Unspecified Place
Y05|Sexual assault by bodily force
Y05.0|Sexual assault by bodily force, Home
Y05.1|Sexual assault by bodily force, Residential Institution
Y05.2|Sexual assault by bodily force, School, Other Institution and Public Admimistration Area
Y05.3|Sexual assault by bodily force, Sports and Athletic Areas
Y05.4|Sexual assault by bodily force, Street and Highway
Y05.5|Sexual assault by bodily force, Trade and Service Area
Y05.6|Sexual assault by bodily force, Industrial and Construction Area
Y05.7|Sexual assault by bodily force, Farm
Y05.8|Sexual assault by bodily force, Other Specified Area
Y05.9|Sexual assault by bodily force, Unspecified Place
Y06|Neglect and abandonment
Y06.0|By spouse or partner
Y06.1|By parent
Y06.2|By acquaintance or friend
Y06.8|By other specified persons
Y06.9|By unspecified person
Y07|Other maltreatment
Y07.0|By spouse or partner
Y07.1|By parent
Y07.2|By acquaintance or friend
Y07.3|By official authorities
Y07.8|By other specified persons
Y07.9|By unspecified person
Y08|Assault by other specified means
Y08.0|Assault by other specified means, Home
Y08.1|Assault by other specified means, Residential Institution
Y08.2|Assault by other specified means, School, Other Institution and Public Admimistration Area
Y08.3|Assault by other specified means, Sports and Athletic Areas
Y08.4|Assault by other specified means, Street and Highway
Y08.5|Assault by other specified means, Trade and Service Area
Y08.6|Assault by other specified means, Industrial and Construction Area
Y08.7|Assault by other specified means, Farm
Y08.8|Assault by other specified means, Other Specified Area
Y08.9|Assault by other specified means, Unspecified Place
Y09|Assault by unspecified means
Y09.0|Assault by unspecified means, Home
Y09.1|Assault by unspecified means, Residential Institution
Y09.2|Assault by unspecified means, School, Other Institution and Public Admimistration Area
Y09.3|Assault by unspecified means, Sports and Athletic Areas
Y09.4|Assault by unspecified means, Street and Highway
Y09.5|Assault by unspecified means, Trade and Service Area
Y09.6|Assault by unspecified means, Industrial and Construction Area
Y09.7|Assault by unspecified means, Farm
Y09.8|Assault by unspecified means, Other Specified Area
Y09.9|Assault by unspecified means, Unspecified Place
Y10|Poisoning by and exposure to nonopioid analgesics, antipyretics and antirheumatics, undetermined intent
Y10.0|Poisoning by and exposure to nonopioid analgesics, antipyretics and antirheumatics, undetermined intent, Home
Y10.1|Poisoning by and exposure to nonopioid analgesics, antipyretics and antirheumatics, undetermined intent, Residential Institution
Y10.2|Poisoning by and exposure to nonopioid analgesics, antipyretics and antirheumatics, undetermined intent, School, Other Institution and Public Admimistration Area
Y10.3|Poisoning by and exposure to nonopioid analgesics, antipyretics and antirheumatics, undetermined intent, Sports and Athletic Areas
Y10.4|Poisoning by and exposure to nonopioid analgesics, antipyretics and antirheumatics, undetermined intent, Street and Highway
Y10.5|Poisoning by and exposure to nonopioid analgesics, antipyretics and antirheumatics, undetermined intent, Trade and Service Area
Y10.6|Poisoning by and exposure to nonopioid analgesics, antipyretics and antirheumatics, undetermined intent, Industrial and Construction Area
Y10.7|Poisoning by and exposure to nonopioid analgesics, antipyretics and antirheumatics, undetermined intent, Farm
Y10.8|Poisoning by and exposure to nonopioid analgesics, antipyretics and antirheumatics, undetermined intent, Other Specified Area
Y10.9|Poisoning by and exposure to nonopioid analgesics, antipyretics and antirheumatics, undetermined intent, Unspecified Place
Y11|Poisoning by and exposure to antiepileptic, sedative-hypnotic, antiparkinsonism and psychotropic drugs, not elsewhere classified, undetermined intent
Y11.0|Poisoning by and exposure to antiepileptic, sedative-hypnotic, antiparkinsonism and psychotropic drugs, not elsewhere classified, undetermined intent, Home
Y11.1|Poisoning by and exposure to antiepileptic, sedative-hypnotic, antiparkinsonism and psychotropic drugs, not elsewhere classified, undetermined intent, Residential Institution
Y11.2|Poisoning by and exposure to antiepileptic, sedative-hypnotic, antiparkinsonism and psychotropic drugs, not elsewhere classified, undetermined intent, School, Other Institution and Public Admimistration Area
Y11.3|Poisoning by and exposure to antiepileptic, sedative-hypnotic, antiparkinsonism and psychotropic drugs, not elsewhere classified, undetermined intent, Sports and Athletic Areas
Y11.4|Poisoning by and exposure to antiepileptic, sedative-hypnotic, antiparkinsonism and psychotropic drugs, not elsewhere classified, undetermined intent, Street and Highway
Y11.5|Poisoning by and exposure to antiepileptic, sedative-hypnotic, antiparkinsonism and psychotropic drugs, not elsewhere classified, undetermined intent, Trade and Service Area
Y11.6|Poisoning by and exposure to antiepileptic, sedative-hypnotic, antiparkinsonism and psychotropic drugs, not elsewhere classified, undetermined intent, Industrial and Construction Area
Y11.7|Poisoning by and exposure to antiepileptic, sedative-hypnotic, antiparkinsonism and psychotropic drugs, not elsewhere classified, undetermined intent, Farm
Y11.8|Poisoning by and exposure to antiepileptic, sedative-hypnotic, antiparkinsonism and psychotropic drugs, not elsewhere classified, undetermined intent, Other Specified Area
Y11.9|Poisoning by and exposure to antiepileptic, sedative-hypnotic, antiparkinsonism and psychotropic drugs, not elsewhere classified, undetermined intent, Unspecified Place
Y12|Poisoning by and exposure to narcotics and psychodysleptics [hallucinogens], not elsewhere classified, undetermined intent
Y12.0|Poisoning by and exposure to narcotics and psychodysleptics [hallucinogens], not elsewhere classified, undetermined intent, Home
Y12.1|Poisoning by and exposure to narcotics and psychodysleptics [hallucinogens], not elsewhere classified, undetermined intent, Residential Institution
Y12.2|Poisoning by and exposure to narcotics and psychodysleptics [hallucinogens], not elsewhere classified, undetermined intent, School, Other Institution and Public Admimistration Area
Y12.3|Poisoning by and exposure to narcotics and psychodysleptics [hallucinogens], not elsewhere classified, undetermined intent, Sports and Athletic Areas
Y12.4|Poisoning by and exposure to narcotics and psychodysleptics [hallucinogens], not elsewhere classified, undetermined intent, Street and Highway
Y12.5|Poisoning by and exposure to narcotics and psychodysleptics [hallucinogens], not elsewhere classified, undetermined intent, Trade and Service Area
Y12.6|Poisoning by and exposure to narcotics and psychodysleptics [hallucinogens], not elsewhere classified, undetermined intent, Industrial and Construction Area
Y12.7|Poisoning by and exposure to narcotics and psychodysleptics [hallucinogens], not elsewhere classified, undetermined intent, Farm
Y12.8|Poisoning by and exposure to narcotics and psychodysleptics [hallucinogens], not elsewhere classified, undetermined intent, Other Specified Area
Y12.9|Poisoning by and exposure to narcotics and psychodysleptics [hallucinogens], not elsewhere classified, undetermined intent, Unspecified Place
Y13|Poisoning by and exposure to other drugs acting on the autonomic nervous system, undetermined intent
Y13.0|Poisoning by and exposure to other drugs acting on the autonomic nervous system, undetermined intent, Home
Y13.1|Poisoning by and exposure to other drugs acting on the autonomic nervous system, undetermined intent, Residential Institution
Y13.2|Poisoning by and exposure to other drugs acting on the autonomic nervous system, undetermined intent, School, Other Institution and Public Admimistration Area
Y13.3|Poisoning by and exposure to other drugs acting on the autonomic nervous system, undetermined intent, Sports and Athletic Areas
Y13.4|Poisoning by and exposure to other drugs acting on the autonomic nervous system, undetermined intent, Street and Highway
Y13.5|Poisoning by and exposure to other drugs acting on the autonomic nervous system, undetermined intent, Trade and Service Area
Y13.6|Poisoning by and exposure to other drugs acting on the autonomic nervous system, undetermined intent, Industrial and Construction Area
Y13.7|Poisoning by and exposure to other drugs acting on the autonomic nervous system, undetermined intent, Farm
Y13.8|Poisoning by and exposure to other drugs acting on the autonomic nervous system, undetermined intent, Other Specified Area
Y13.9|Poisoning by and exposure to other drugs acting on the autonomic nervous system, undetermined intent, Unspecified Place
Y14|Poisoning by and exposure to other and unspecified drugs, medicaments and biological substances, undetermined intent
Y14.0|Poisoning by and exposure to other and unspecified drugs, medicaments and biological substances, undetermined intent, Home
Y14.1|Poisoning by and exposure to other and unspecified drugs, medicaments and biological substances, undetermined intent, Residential Institution
Y14.2|Poisoning by and exposure to other and unspecified drugs, medicaments and biological substances, undetermined intent, School, Other Institution and Public Admimistration Area
Y14.3|Poisoning by and exposure to other and unspecified drugs, medicaments and biological substances, undetermined intent, Sports and Athletic Areas
Y14.4|Poisoning by and exposure to other and unspecified drugs, medicaments and biological substances, undetermined intent, Street and Highway
Y14.5|Poisoning by and exposure to other and unspecified drugs, medicaments and biological substances, undetermined intent, Trade and Service Area
Y14.6|Poisoning by and exposure to other and unspecified drugs, medicaments and biological substances, undetermined intent, Industrial and Construction Area
Y14.7|Poisoning by and exposure to other and unspecified drugs, medicaments and biological substances, undetermined intent, Farm
Y14.8|Poisoning by and exposure to other and unspecified drugs, medicaments and biological substances, undetermined intent, Other Specified Area
Y14.9|Poisoning by and exposure to other and unspecified drugs, medicaments and biological substances, undetermined intent, Unspecified Place
Y15|Poisoning by and exposure to alcohol, undetermined intent
Y15.0|Poisoning by and exposure to alcohol, undetermined intent, Home
Y15.1|Poisoning by and exposure to alcohol, undetermined intent, Residential Institution
Y15.2|Poisoning by and exposure to alcohol, undetermined intent, School, Other Institution and Public Admimistration Area
Y15.3|Poisoning by and exposure to alcohol, undetermined intent, Sports and Athletic Areas
Y15.4|Poisoning by and exposure to alcohol, undetermined intent, Street and Highway
Y15.5|Poisoning by and exposure to alcohol, undetermined intent, Trade and Service Area
Y15.6|Poisoning by and exposure to alcohol, undetermined intent, Industrial and Construction Area
Y15.7|Poisoning by and exposure to alcohol, undetermined intent, Farm
Y15.8|Poisoning by and exposure to alcohol, undetermined intent, Other Specified Area
Y15.9|Poisoning by and exposure to alcohol, undetermined intent, Unspecified Place
Y16|Poisoning by and exposure to organic solvents and halogenated hydrocarbons and their vapours, undetermined intent
Y16.0|Poisoning by and exposure to organic solvents and halogenated hydrocarbons and their vapours, undetermined intent, Home
Y16.1|Poisoning by and exposure to organic solvents and halogenated hydrocarbons and their vapours, undetermined intent, Residential Institution
Y16.2|Poisoning by and exposure to organic solvents and halogenated hydrocarbons and their vapours, undetermined intent, School, Other Institution and Public Admimistration Area
Y16.3|Poisoning by and exposure to organic solvents and halogenated hydrocarbons and their vapours, undetermined intent, Sports and Athletic Areas
Y16.4|Poisoning by and exposure to organic solvents and halogenated hydrocarbons and their vapours, undetermined intent, Street and Highway
Y16.5|Poisoning by and exposure to organic solvents and halogenated hydrocarbons and their vapours, undetermined intent, Trade and Service Area
Y16.6|Poisoning by and exposure to organic solvents and halogenated hydrocarbons and their vapours, undetermined intent, Industrial and Construction Area
Y16.7|Poisoning by and exposure to organic solvents and halogenated hydrocarbons and their vapours, undetermined intent, Farm
Y16.8|Poisoning by and exposure to organic solvents and halogenated hydrocarbons and their vapours, undetermined intent, Other Specified Area
Y16.9|Poisoning by and exposure to organic solvents and halogenated hydrocarbons and their vapours, undetermined intent, Unspecified Place
Y17|Poisoning by and exposure to other gases and vapours, undetermined intent
Y17.0|Poisoning by and exposure to other gases and vapours, undetermined intent, Home
Y17.1|Poisoning by and exposure to other gases and vapours, undetermined intent, Residential Institution
Y17.2|Poisoning by and exposure to other gases and vapours, undetermined intent, School, Other Institution and Public Admimistration Area
Y17.3|Poisoning by and exposure to other gases and vapours, undetermined intent, Sports and Athletic Areas
Y17.4|Poisoning by and exposure to other gases and vapours, undetermined intent, Street and Highway
Y17.5|Poisoning by and exposure to other gases and vapours, undetermined intent, Trade and Service Area
Y17.6|Poisoning by and exposure to other gases and vapours, undetermined intent, Industrial and Construction Area
Y17.7|Poisoning by and exposure to other gases and vapours, undetermined intent, Farm
Y17.8|Poisoning by and exposure to other gases and vapours, undetermined intent, Other Specified Area
Y17.9|Poisoning by and exposure to other gases and vapours, undetermined intent, Unspecified Place
Y18|Poisoning by and exposure to pesticides, undetermined intent
Y18.0|Poisoning by and exposure to pesticides, undetermined intent, Home
Y18.1|Poisoning by and exposure to pesticides, undetermined intent, Residential Institution
Y18.2|Poisoning by and exposure to pesticides, undetermined intent, School, Other Institution and Public Admimistration Area
Y18.3|Poisoning by and exposure to pesticides, undetermined intent, Sports and Athletic Areas
Y18.4|Poisoning by and exposure to pesticides, undetermined intent, Street and Highway
Y18.5|Poisoning by and exposure to pesticides, undetermined intent, Trade and Service Area
Y18.6|Poisoning by and exposure to pesticides, undetermined intent, Industrial and Construction Area
Y18.7|Poisoning by and exposure to pesticides, undetermined intent, Farm
Y18.8|Poisoning by and exposure to pesticides, undetermined intent, Other Specified Area
Y18.9|Poisoning by and exposure to pesticides, undetermined intent, Unspecified Place
Y19|Poisoning by and exposure to other and unspecified chemicals and noxious substances, undetermined intent
Y19.0|Poisoning by and exposure to other and unspecified chemicals and noxious substances, undetermined intent, Home
Y19.1|Poisoning by and exposure to other and unspecified chemicals and noxious substances, undetermined intent, Residential Institution
Y19.2|Poisoning by and exposure to other and unspecified chemicals and noxious substances, undetermined intent, School, Other Institution and Public Admimistration Area
Y19.3|Poisoning by and exposure to other and unspecified chemicals and noxious substances, undetermined intent, Sports and Athletic Areas
Y19.4|Poisoning by and exposure to other and unspecified chemicals and noxious substances, undetermined intent, Street and Highway
Y19.5|Poisoning by and exposure to other and unspecified chemicals and noxious substances, undetermined intent, Trade and Service Area
Y19.6|Poisoning by and exposure to other and unspecified chemicals and noxious substances, undetermined intent, Industrial and Construction Area
Y19.7|Poisoning by and exposure to other and unspecified chemicals and noxious substances, undetermined intent, Farm
Y19.8|Poisoning by and exposure to other and unspecified chemicals and noxious substances, undetermined intent, Other Specified Area
Y19.9|Poisoning by and exposure to other and unspecified chemicals and noxious substances, undetermined intent, Unspecified Place
Y20|Hanging, strangulation and suffocation, undetermined intent
Y20.0|Hanging, strangulation and suffocation, undetermined intent, Home
Y20.1|Hanging, strangulation and suffocation, undetermined intent, Residential Institution
Y20.2|Hanging, strangulation and suffocation, undetermined intent, School, Other Institution and Public Admimistration Area
Y20.3|Hanging, strangulation and suffocation, undetermined intent, Sports and Athletic Areas
Y20.4|Hanging, strangulation and suffocation, undetermined intent, Street and Highway
Y20.5|Hanging, strangulation and suffocation, undetermined intent, Trade and Service Area
Y20.6|Hanging, strangulation and suffocation, undetermined intent, Industrial and Construction Area
Y20.7|Hanging, strangulation and suffocation, undetermined intent, Farm
Y20.8|Hanging, strangulation and suffocation, undetermined intent, Other Specified Area
Y20.9|Hanging, strangulation and suffocation, undetermined intent, Unspecified Place
Y21|Drowning and submersion, undetermined intent
Y21.0|Drowning and submersion, undetermined intent, Home
Y21.1|Drowning and submersion, undetermined intent, Residential Institution
Y21.2|Drowning and submersion, undetermined intent, School, Other Institution and Public Admimistration Area
Y21.3|Drowning and submersion, undetermined intent, Sports and Athletic Areas
Y21.4|Drowning and submersion, undetermined intent, Street and Highway
Y21.5|Drowning and submersion, undetermined intent, Trade and Service Area
Y21.6|Drowning and submersion, undetermined intent, Industrial and Construction Area
Y21.7|Drowning and submersion, undetermined intent, Farm
Y21.8|Drowning and submersion, undetermined intent, Other Specified Area
Y21.9|Drowning and submersion, undetermined intent, Unspecified Place
Y22|Handgun discharge, undetermined intent
Y22.0|Handgun discharge, undetermined intent, Home
Y22.1|Handgun discharge, undetermined intent, Residential Institution
Y22.2|Handgun discharge, undetermined intent, School, Other Institution and Public Admimistration Area
Y22.3|Handgun discharge, undetermined intent, Sports and Athletic Areas
Y22.4|Handgun discharge, undetermined intent, Street and Highway
Y22.5|Handgun discharge, undetermined intent, Trade and Service Area
Y22.6|Handgun discharge, undetermined intent, Industrial and Construction Area
Y22.7|Handgun discharge, undetermined intent, Farm
Y22.8|Handgun discharge, undetermined intent, Other Specified Area
Y22.9|Handgun discharge, undetermined intent, Unspecified Place
Y23|Rifle, shotgun and larger firearm discharge, undetermined intent
Y23.0|Rifle, shotgun and larger firearm discharge, undetermined intent, Home
Y23.1|Rifle, shotgun and larger firearm discharge, undetermined intent, Residential Institution
Y23.2|Rifle, shotgun and larger firearm discharge, undetermined intent, School, Other Institution and Public Admimistration Area
Y23.3|Rifle, shotgun and larger firearm discharge, undetermined intent, Sports and Athletic Areas
Y23.4|Rifle, shotgun and larger firearm discharge, undetermined intent, Street and Highway
Y23.5|Rifle, shotgun and larger firearm discharge, undetermined intent, Trade and Service Area
Y23.6|Rifle, shotgun and larger firearm discharge, undetermined intent, Industrial and Construction Area
Y23.7|Rifle, shotgun and larger firearm discharge, undetermined intent, Farm
Y23.8|Rifle, shotgun and larger firearm discharge, undetermined intent, Other Specified Area
Y23.9|Rifle, shotgun and larger firearm discharge, undetermined intent, Unspecified Place
Y24|Other and unspecified firearm discharge, undetermined intent
Y24.0|Other and unspecified firearm discharge, undetermined intent, Home
Y24.1|Other and unspecified firearm discharge, undetermined intent, Residential Institution
Y24.2|Other and unspecified firearm discharge, undetermined intent, School, Other Institution and Public Admimistration Area
Y24.3|Other and unspecified firearm discharge, undetermined intent, Sports and Athletic Areas
Y24.4|Other and unspecified firearm discharge, undetermined intent, Street and Highway
Y24.5|Other and unspecified firearm discharge, undetermined intent, Trade and Service Area
Y24.6|Other and unspecified firearm discharge, undetermined intent, Industrial and Construction Area
Y24.7|Other and unspecified firearm discharge, undetermined intent, Farm
Y24.8|Other and unspecified firearm discharge, undetermined intent, Other Specified Area
Y24.9|Other and unspecified firearm discharge, undetermined intent, Unspecified Place
Y25|Contact with explosive material, undetermined intent
Y25.0|Contact with explosive material, undetermined intent, Home
Y25.1|Contact with explosive material, undetermined intent, Residential Institution
Y25.2|Contact with explosive material, undetermined intent, School, Other Institution and Public Admimistration Area
Y25.3|Contact with explosive material, undetermined intent, Sports and Athletic Areas
Y25.4|Contact with explosive material, undetermined intent, Street and Highway
Y25.5|Contact with explosive material, undetermined intent, Trade and Service Area
Y25.6|Contact with explosive material, undetermined intent, Industrial and Construction Area
Y25.7|Contact with explosive material, undetermined intent, Farm
Y25.8|Contact with explosive material, undetermined intent, Other Specified Area
Y25.9|Contact with explosive material, undetermined intent, Unspecified Place
Y26|Exposure to smoke, fire and flames, undetermined intent
Y26.0|Exposure to smoke, fire and flames, undetermined intent, Home
Y26.1|Exposure to smoke, fire and flames, undetermined intent, Residential Institution
Y26.2|Exposure to smoke, fire and flames, undetermined intent, School, Other Institution and Public Admimistration Area
Y26.3|Exposure to smoke, fire and flames, undetermined intent, Sports and Athletic Areas
Y26.4|Exposure to smoke, fire and flames, undetermined intent, Street and Highway
Y26.5|Exposure to smoke, fire and flames, undetermined intent, Trade and Service Area
Y26.6|Exposure to smoke, fire and flames, undetermined intent, Industrial and Construction Area
Y26.7|Exposure to smoke, fire and flames, undetermined intent, Farm
Y26.8|Exposure to smoke, fire and flames, undetermined intent, Other Specified Area
Y26.9|Exposure to smoke, fire and flames, undetermined intent, Unspecified Place
Y27|Contact with steam, hot vapours and hot objects, undetermined intent
Y27.0|Contact with steam, hot vapours and hot objects, undetermined intent, Home
Y27.1|Contact with steam, hot vapours and hot objects, undetermined intent, Residential Institution
Y27.2|Contact with steam, hot vapours and hot objects, undetermined intent, School, Other Institution and Public Admimistration Area
Y27.3|Contact with steam, hot vapours and hot objects, undetermined intent, Sports and Athletic Areas
Y27.4|Contact with steam, hot vapours and hot objects, undetermined intent, Street and Highway
Y27.5|Contact with steam, hot vapours and hot objects, undetermined intent, Trade and Service Area
Y27.6|Contact with steam, hot vapours and hot objects, undetermined intent, Industrial and Construction Area
Y27.7|Contact with steam, hot vapours and hot objects, undetermined intent, Farm
Y27.8|Contact with steam, hot vapours and hot objects, undetermined intent, Other Specified Area
Y27.9|Contact with steam, hot vapours and hot objects, undetermined intent, Unspecified Place
Y28|Contact with sharp object, undetermined intent
Y28.0|Contact with sharp object, undetermined intent, Home
Y28.1|Contact with sharp object, undetermined intent, Residential Institution
Y28.2|Contact with sharp object, undetermined intent, School, Other Institution and Public Admimistration Area
Y28.3|Contact with sharp object, undetermined intent, Sports and Athletic Areas
Y28.4|Contact with sharp object, undetermined intent, Street and Highway
Y28.5|Contact with sharp object, undetermined intent, Trade and Service Area
Y28.6|Contact with sharp object, undetermined intent, Industrial and Construction Area
Y28.7|Contact with sharp object, undetermined intent, Farm
Y28.8|Contact with sharp object, undetermined intent, Other Specified Area
Y28.9|Contact with sharp object, undetermined intent, Unspecified Place
Y29|Contact with blunt object, undetermined intent
Y29.0|Contact with blunt object, undetermined intent, Home
Y29.1|Contact with blunt object, undetermined intent, Residential Institution
Y29.2|Contact with blunt object, undetermined intent, School, Other Institution and Public Admimistration Area
Y29.3|Contact with blunt object, undetermined intent, Sports and Athletic Areas
Y29.4|Contact with blunt object, undetermined intent, Street and Highway
Y29.5|Contact with blunt object, undetermined intent, Trade and Service Area
Y29.6|Contact with blunt object, undetermined intent, Industrial and Construction Area
Y29.7|Contact with blunt object, undetermined intent, Farm
Y29.8|Contact with blunt object, undetermined intent, Other Specified Area
Y29.9|Contact with blunt object, undetermined intent, Unspecified Place
Y30|Falling, jumping or pushed from a high place, undetermined intent
Y30.0|Falling, jumping or pushed from a high place, undetermined intent, Home
Y30.1|Falling, jumping or pushed from a high place, undetermined intent, Residential Institution
Y30.2|Falling, jumping or pushed from a high place, undetermined intent, School, Other Institution and Public Admimistration Area
Y30.3|Falling, jumping or pushed from a high place, undetermined intent, Sports and Athletic Areas
Y30.4|Falling, jumping or pushed from a high place, undetermined intent, Street and Highway
Y30.5|Falling, jumping or pushed from a high place, undetermined intent, Trade and Service Area
Y30.6|Falling, jumping or pushed from a high place, undetermined intent, Industrial and Construction Area
Y30.7|Falling, jumping or pushed from a high place, undetermined intent, Farm
Y30.8|Falling, jumping or pushed from a high place, undetermined intent, Other Specified Area
Y30.9|Falling, jumping or pushed from a high place, undetermined intent, Unspecified Place
Y31|Falling, lying or running before or into moving object, undetermined intent
Y31.0|Falling, lying or running before or into moving object, undetermined intent, Home
Y31.1|Falling, lying or running before or into moving object, undetermined intent, Residential Institution
Y31.2|Falling, lying or running before or into moving object, undetermined intent, School, Other Institution and Public Admimistration Area
Y31.3|Falling, lying or running before or into moving object, undetermined intent, Sports and Athletic Areas
Y31.4|Falling, lying or running before or into moving object, undetermined intent, Street and Highway
Y31.5|Falling, lying or running before or into moving object, undetermined intent, Trade and Service Area
Y31.6|Falling, lying or running before or into moving object, undetermined intent, Industrial and Construction Area
Y31.7|Falling, lying or running before or into moving object, undetermined intent, Farm
Y31.8|Falling, lying or running before or into moving object, undetermined intent, Other Specified Area
Y31.9|Falling, lying or running before or into moving object, undetermined intent, Unspecified Place
Y32|Crashing of motor vehicle, undetermined intent
Y32.0|Crashing of motor vehicle, undetermined intent, Home
Y32.1|Crashing of motor vehicle, undetermined intent, Residential Institution
Y32.2|Crashing of motor vehicle, undetermined intent, School, Other Institution and Public Admimistration Area
Y32.3|Crashing of motor vehicle, undetermined intent, Sports and Athletic Areas
Y32.4|Crashing of motor vehicle, undetermined intent, Street and Highway
Y32.5|Crashing of motor vehicle, undetermined intent, Trade and Service Area
Y32.6|Crashing of motor vehicle, undetermined intent, Industrial and Construction Area
Y32.7|Crashing of motor vehicle, undetermined intent, Farm
Y32.8|Crashing of motor vehicle, undetermined intent, Other Specified Area
Y32.9|Crashing of motor vehicle, undetermined intent, Unspecified Place
Y33|Other specified events, undetermined intent
Y33.0|Other specified events, undetermined intent, Home
Y33.1|Other specified events, undetermined intent, Residential Institution
Y33.2|Other specified events, undetermined intent, School, Other Institution and Public Admimistration Area
Y33.3|Other specified events, undetermined intent, Sports and Athletic Areas
Y33.4|Other specified events, undetermined intent, Street and Highway
Y33.5|Other specified events, undetermined intent, Trade and Service Area
Y33.6|Other specified events, undetermined intent, Industrial and Construction Area
Y33.7|Other specified events, undetermined intent, Farm
Y33.8|Other specified events, undetermined intent, Other Specified Area
Y33.9|Other specified events, undetermined intent, Unspecified Place
Y34|Unspecified event, undetermined intent
Y34.0|Unspecified event, undetermined intent, Home
Y34.1|Unspecified event, undetermined intent, Residential Institution
Y34.2|Unspecified event, undetermined intent, School, Other Institution and Public Admimistration Area
Y34.3|Unspecified event, undetermined intent, Sports and Athletic Areas
Y34.4|Unspecified event, undetermined intent, Street and Highway
Y34.5|Unspecified event, undetermined intent, Trade and Service Area
Y34.6|Unspecified event, undetermined intent, Industrial and Construction Area
Y34.7|Unspecified event, undetermined intent, Farm
Y34.8|Unspecified event, undetermined intent, Other Specified Area
Y34.9|Unspecified event, undetermined intent, Unspecified Place
Y35|Legal intervention
Y35.0|Legal intervention involving firearm discharge
Y35.1|Legal intervention involving explosives
Y35.2|Legal intervention involving gas
Y35.3|Legal intervention involving blunt objects
Y35.4|Legal intervention involving sharp objects
Y35.5|Legal execution
Y35.6|Legal intervention involving other specified means
Y35.7|Legal intervention, means unspecified
Y36|Operations of war
Y36.0|War operations involving explosion of marine weapons
Y36.1|War operations involving destruction of aircraft
Y36.2|War operations involving other explosions and fragments
Y36.3|War operations involving fires, conflagrations and hot substances
Y36.4|War operations involving firearm discharge and other forms of conventional warfare
Y36.5|War operations involving nuclear weapons
Y36.6|War operations involving biological weapons
Y36.7|War operations involving chemical weapons and other forms of unconventional warfare
Y36.8|War operations occurring after cessation of hostilities
Y36.9|War operations, unspecified
Y40|Systemic antibiotics
Y40.0|Penicillins
Y40.1|Cefalosporins and other beta-lactam antibiotics
Y40.2|Chloramphenicol group
Y40.3|Macrolides
Y40.4|Tetracyclines
Y40.5|Aminoglycosides
Y40.6|Rifamycins
Y40.7|Antifungal antibiotics, systemically used
Y40.8|Other systemic antibiotics
Y40.9|Systemic antibiotic, unspecified
Y41|Other systemic anti-infectives and antiparasitics
Y41.0|Sulfonamides
Y41.1|Antimycobacterial drugs
Y41.2|Antimalarials and drugs acting on other blood protozoa
Y41.3|Other antiprotozoal drugs
Y41.4|Anthelminthics
Y41.5|Antiviral drugs
Y41.8|Other specified systemic anti-infectives and antiparasitics
Y41.9|Systemic anti-infective and antiparasitic, unspecified
Y42|Hormones and their synthetic substitutes and antagonists, not elsewhere classified
Y42.0|Glucocorticoids and synthetic analogues
Y42.1|Thyroid hormones and substitutes
Y42.2|Antithyroid drugs
Y42.3|Insulin and oral hypoglycaemic [antidiabetic] drugs
Y42.4|Oral contraceptives
Y42.5|Other estrogens and progestogens
Y42.6|Antigonadotrophins, antiestrogens, antiandrogens, not elsewhere classified
Y42.7|Androgens and anabolic congeners
Y42.8|Other and unspecified hormones and their synthetic substitutes
Y42.9|Other and unspecified hormone antagonists
Y43|Primarily systemic agents
Y43.0|Antiallergic and antiemetic drugs
Y43.1|Antineoplastic antimetabolites
Y43.2|Antineoplastic natural products
Y43.3|Other antineoplastic drugs
Y43.4|Immunosuppressive agents
Y43.5|Acidifying and alkalizing agents
Y43.6|Enzymes, not elsewhere classified
Y43.8|Other primarily systemic agents, not elsewhere classified
Y43.9|Primarily systemic agent, unspecified
Y44|Agents primarily affecting blood constituents
Y44.0|Iron preparations and other anti-hypochromic-anaemia preparations
Y44.1|Vitamin B12, folic acid and other anti-megaloblastic-anaemia preparations
Y44.2|Anticoagulants
Y44.3|Anticoagulant antagonists, vitamin K and other coagulants
Y44.4|Antithrombotic drugs [platelet-aggregation inhibitors]
Y44.5|Thrombolytic drugs
Y44.6|Natural blood and blood products
Y44.7|Plasma substitutes
Y44.9|Other and unspecified agents affecting blood constituents
Y45|Analgesics, antipyretics and anti-inflammatory drugs
Y45.0|Opioids and related analgesics
Y45.1|Salicylates
Y45.2|Propionic acid derivatives
Y45.3|Other nonsteroidal anti-inflammatory drugs [NSAID]
Y45.4|Antirheumatics
Y45.5|4-Aminophenol derivatives
Y45.8|Other analgesics and antipyretics
Y45.9|Analgesic, antipyretic and anti-inflammatory drug, unspecified
Y46|Antiepileptics and antiparkinsonism drugs
Y46.0|Succinimides
Y46.1|Oxazolidinediones
Y46.2|Hydantoin derivatives
Y46.3|Deoxybarbiturates
Y46.4|Iminostilbenes
Y46.5|Valproic acid
Y46.6|Other and unspecified antiepileptics
Y46.7|Antiparkinsonism drugs
Y46.8|Antispasticity drugs
Y47|Sedatives, hypnotics and antianxiety drugs
Y47.0|Barbiturates, not elsewhere classified
Y47.1|Benzodiazepines
Y47.2|Cloral derivatives
Y47.3|Paraldehyde
Y47.4|Bromine compounds
Y47.5|Mixed sedatives and hypnotics, not elsewhere classified
Y47.8|Other sedatives, hypnotics and antianxiety drugs
Y47.9|Sedative, hypnotic and antianxiety drug, unspecified
Y48|Anaesthetics and therapeutic gases
Y48.0|Inhaled anaesthetics
Y48.1|Parenteral anaesthetics
Y48.2|Other and unspecified general anaesthetics
Y48.3|Local anaesthetics
Y48.4|Anaesthetic, unspecified
Y48.5|Therapeutic gases
Y49|Psychotropic drugs, not elsewhere classified
Y49.0|Tricyclic and tetracyclic antidepressants
Y49.1|Monoamine-oxidase-inhibitor antidepressants
Y49.2|Other and unspecified antidepressants
Y49.3|Phenothiazine antipsychotics and neuroleptics
Y49.4|Butyrophenone and thioxanthene neuroleptics
Y49.5|Other antipsychotics and neuroleptics
Y49.6|Psychodysleptics [hallucinogens]
Y49.7|Psychostimulants with abuse potential
Y49.8|Other psychotropic drugs, not elsewhere classified
Y49.9|Psychotropic drug, unspecified
Y50|Central nervous system stimulants, not elsewhere classified
Y50.0|Analeptics
Y50.1|Opioid receptor antagonists
Y50.2|Methylxanthines, not elsewhere classified
Y50.8|Other central nervous system stimulants
Y50.9|Central nervous system stimulant, unspecified
Y51|Drugs primarily affecting the autonomic nervous system
Y51.0|Anticholinesterase agents
Y51.1|Other parasympathomimetics [cholinergics]
Y51.2|Ganglionic blocking drugs, not elsewhere classified
Y51.3|Other parasympatholytics [anticholinergics and antimuscarinics] and spasmolytics, not elsewhere classified
Y51.4|Predominantly alpha-adrenoreceptor agonists, not elsewhere classified
Y51.5|Predominantly beta-adrenoreceptor agonists, not elsewhere classified
Y51.6|Alpha-adrenoreceptor antagonists, not elsewhere classified
Y51.7|Beta-adrenoreceptor antagonists, not elsewhere classified
Y51.8|Centrally acting and adrenergic-neuron-blocking agents, not elsewhere classified
Y51.9|Other and unspecified drugs primarily affecting the autonomic nervous system
Y52|Agents primarily affecting the cardiovascular system
Y52.0|Cardiac-stimulant glycosides and drugs of similar action
Y52.1|Calcium-channel blockers
Y52.2|Other antidysrhythmic drugs, not elsewhere classified
Y52.3|Coronary vasodilators, not elsewhere classified
Y52.4|Angiotensin-converting-enzyme inhibitors
Y52.5|Other antihypertensive drugs, not elsewhere classified
Y52.6|Antihyperlipidaemic and antiarteriosclerotic drugs
Y52.7|Peripheral vasodilators
Y52.8|Antivaricose drugs, including sclerosing agents
Y52.9|Other and unspecified agents primarily affecting the cardiovascular system
Y53|Agents primarily affecting the gastrointestinal system
Y53.0|Histamine H2-receptor antagonists
Y53.1|Other antacids and anti-gastric-secretion drugs
Y53.2|Stimulant laxatives
Y53.3|Saline and osmotic laxatives
Y53.4|Other laxatives
Y53.5|Digestants
Y53.6|Antidiarrhoeal drugs
Y53.7|Emetics
Y53.8|Other agents primarily affecting the gastrointestinal system
Y53.9|Agent primarily affecting the gastrointestinal system, unspecified
Y54|Agents primarily affecting water-balance and mineral and uric acid metabolism
Y54.0|Mineralocorticoids
Y54.1|Mineralocorticoid antagonists [aldosterone antagonists]
Y54.2|Carbonic-anhydrase inhibitors
Y54.3|Benzothiadiazine derivatives
Y54.4|Loop [high-ceiling] diuretics
Y54.5|Other diuretics
Y54.6|Electrolytic, caloric and water-balance agents
Y54.7|Agents affecting calcification
Y54.8|Agents affecting uric acid metabolism
Y54.9|Mineral salts, not elsewhere classified
Y55|Agents primarily acting on smooth and skeletal muscles and the respiratory system
Y55.0|Oxytocic drugs
Y55.1|Skeletal muscle relaxants [neuromuscular blocking agents]
Y55.2|Other and unspecified agents primarily acting on muscles
Y55.3|Antitussives
Y55.4|Expectorants
Y55.5|Anti-common-cold drugs
Y55.6|Antiasthmatics, not elsewhere classified
Y55.7|Other and unspecified agents primarily acting on the respiratory system
Y56|Topical agents primarily affecting skin and mucous membrane and ophthalmological, otorhinolaryngological and dental drugs
Y56.0|Local antifungal, anti-infective and anti-inflammatory drugs, not elsewhere classified
Y56.1|Antipruritics
Y56.2|Local astringents and local detergents
Y56.3|Emollients, demulcents and protectants
Y56.4|Keratolytics, keratoplastics and other hair treatment drugs and preparations
Y56.5|Ophthalmological drugs and preparations
Y56.6|Otorhinolaryngological drugs and preparations
Y56.7|Dental drugs, topically applied
Y56.8|Other topical agents
Y56.9|Topical agent, unspecified
Y57|Other and unspecified drugs and medicaments
Y57.0|Appetite depressants [anorectics]
Y57.1|Lipotropic drugs
Y57.2|Antidotes and chelating agents, not elsewhere classified
Y57.3|Alcohol deterrents
Y57.4|Pharmaceutical excipients
Y57.5|X-ray contrast media
Y57.6|Other diagnostic agents
Y57.7|Vitamins, not elsewhere classified
Y57.8|Other drugs and medicaments
Y57.9|Drug or medicament, unspecified
Y58|Bacterial vaccines
Y58.0|BCG vaccine
Y58.1|Typhoid and paratyphoid vaccine
Y58.2|Cholera vaccine
Y58.3|Plague vaccine
Y58.4|Tetanus vaccine
Y58.5|Diphtheria vaccine
Y58.6|Pertussis vaccine, including combinations with a pertussis component
Y58.8|Mixed bacterial vaccines, except combinations with a pertussis component
Y58.9|Other and unspecified bacterial vaccines
Y59|Other and unspecified vaccines and biological substances
Y59.0|Viral vaccines
Y59.1|Rickettsial vaccines
Y59.2|Protozoal vaccines
Y59.3|Immunoglobulin
Y59.8|Other specified vaccines and biological substances
Y59.9|Vaccine or biological substance, unspecified
Y60|Unintentional cut, puncture, perforation or haemorrhage during surgical and medical care
Y60.0|During surgical operation
Y60.1|During infusion or transfusion
Y60.2|During kidney dialysis or other perfusion
Y60.3|During injection or immunization
Y60.4|During endoscopic examination
Y60.5|During heart catheterization
Y60.6|During aspiration, puncture and other catheterization
Y60.7|During administration of enema
Y60.8|During other surgical and medical care
Y60.9|During unspecified surgical and medical care
Y61|Foreign object accidentally left in body during surgical and medical care
Y61.0|During surgical operation
Y61.1|During infusion or transfusion
Y61.2|During kidney dialysis or other perfusion
Y61.3|During injection or immunization
Y61.4|During endoscopic examination
Y61.5|During heart catheterization
Y61.6|During aspiration, puncture and other catheterization
Y61.7|During removal of catheter or packing
Y61.8|During other surgical and medical care
Y61.9|During unspecified surgical and medical care
Y62|Failure of sterile precautions during surgical and medical care
Y62.0|During surgical operation
Y62.1|During infusion or transfusion
Y62.2|During kidney dialysis or other perfusion
Y62.3|During injection or immunization
Y62.4|During endoscopic examination
Y62.5|During heart catheterization
Y62.6|During aspiration, puncture and other catheterization
Y62.8|During other surgical and medical care
Y62.9|During unspecified surgical and medical care
Y63|Failure in dosage during surgical and medical care
Y63.0|Excessive amount of blood or other fluid given during transfusion or infusion
Y63.1|Incorrect dilution of fluid used during infusion
Y63.2|Overdose of radiation given during therapy
Y63.3|Inadvertent exposure of patient to radiation during medical care
Y63.4|Failure in dosage in electroshock or insulin-shock therapy
Y63.5|Inappropriate temperature in local application and packing
Y63.6|Nonadministration of necessary drug, medicament or biological substance
Y63.8|Failure in dosage during other surgical and medical care
Y63.9|Failure in dosage during unspecified surgical and medical care
Y64|Contaminated medical or biological substances
Y64.0|Contaminated medical or biological substance, transfused or infused
Y64.1|Contaminated medical or biological substance, injected or used for immunization
Y64.8|Contaminated medical or biological substance administered by other means
Y64.9|Contaminated medical or biological substance administered by unspecified means
Y65|Other misadventures during surgical and medical care
Y65.0|Mismatched blood used in transfusion
Y65.1|Wrong fluid used in infusion
Y65.2|Failure in suture or ligature during surgical operation
Y65.3|Endotracheal tube wrongly placed during anaesthetic procedure
Y65.4|Failure to introduce or to remove other tube or instrument
Y65.5|Performance of inappropriate operation
Y65.8|Other specified misadventures during surgical and medical care
Y66|Nonadministration of surgical and medical care
Y69|Unspecified misadventure during surgical and medical care
Y70|Anaesthesiology devices associated with adverse incidents
Y70.0|Anaesthesiology devices associated with adverse incidents: Diagnostic and monitoring devices
Y70.1|Anaesthesiology devices associated with adverse incidents: Therapeutic (nonsurgical) and rehabilitative devices
Y70.2|Anaesthesiology devices associated with adverse incidents: Prosthetic and other implants, materials and accessory devices
Y70.3|Anaesthesiology devices associated with adverse incidents: Surgical instruments, materials and devices (including sutures)
Y70.8|Anaesthesiology devices associated with adverse incidents: Miscellaneous devices, not elsewhere classified
Y71|Cardiovascular devices associated with adverse incidents
Y71.0|Cardiovascular devices associated with adverse incidents: Diagnostic and monitoring devices
Y71.1|Cardiovascular devices associated with adverse incidents: Therapeutic (nonsurgical) and rehabilitative devices
Y71.2|Cardiovascular devices associated with adverse incidents: Prosthetic and other implants, materials and accessory devices
Y71.3|Cardiovascular devices associated with adverse incidents: Surgical instruments, materials and devices (including sutures)
Y71.8|Cardiovascular devices associated with adverse incidents: Miscellaneous devices, not elsewhere classified
Y72|Otorhinolaryngological devices associated with adverse incidents
Y72.0|Otorhinolaryngological devices associated with adverse incidents: Diagnostic and monitoring devices
Y72.1|Otorhinolaryngological devices associated with adverse incidents: Therapeutic (nonsurgical) and rehabilitative devices
Y72.2|Otorhinolaryngological devices associated with adverse incidents: Prosthetic and other implants, materials and accessory devices
Y72.3|Otorhinolaryngological devices associated with adverse incidents: Surgical instruments, materials and devices (including sutures)
Y72.8|Otorhinolaryngological devices associated with adverse incidents: Miscellaneous devices, not elsewhere classified
Y73|Gastroenterology and urology devices associated with adverse incidents
Y73.0|Gastroenterology and urology devices associated with adverse incidents: Diagnostic and monitoring devices
Y73.1|Gastroenterology and urology devices associated with adverse incidents: Therapeutic (nonsurgical) and rehabilitative devices
Y73.2|Gastroenterology and urology devices associated with adverse incidents: Prosthetic and other implants, materials and accessory devices
Y73.3|Gastroenterology and urology devices associated with adverse incidents: Surgical instruments, materials and devices (including sutures)
Y73.8|Gastroenterology and urology devices associated with adverse incidents: Miscellaneous devices, not elsewhere classified
Y74|General hospital and personal-use devices associated with adverse incidents
Y74.0|General hospital and personal-use devices associated with adverse incidents: Diagnostic and monitoring devices
Y74.1|General hospital and personal-use devices associated with adverse incidents: Therapeutic (nonsurgical) and rehabilitative devices
Y74.2|General hospital and personal-use devices associated with adverse incidents: Prosthetic and other implants, materials and accessory devices
Y74.3|General hospital and personal-use devices associated with adverse incidents: Surgical instruments, materials and devices (including sutures)
Y74.8|General hospital and personal-use devices associated with adverse incidents: Miscellaneous devices, not elsewhere classified
Y75|Neurological devices associated with adverse incidents
Y75.0|Neurological devices associated with adverse incidents: Diagnostic and monitoring devices
Y75.1|Neurological devices associated with adverse incidents: Therapeutic (nonsurgical) and rehabilitative devices
Y75.2|Neurological devices associated with adverse incidents: Prosthetic and other implants, materials and accessory devices
Y75.3|Neurological devices associated with adverse incidents: Surgical instruments, materials and devices (including sutures)
Y75.8|Neurological devices associated with adverse incidents: Miscellaneous devices, not elsewhere classified
Y76|Obstetric and gynaecological devices associated with adverse incidents
Y76.0|Obstetric and gynaecological devices associated with adverse incidents: Diagnostic and monitoring devices
Y76.1|Obstetric and gynaecological devices associated with adverse incidents: Therapeutic (nonsurgical) and rehabilitative devices
Y76.2|Obstetric and gynaecological devices associated with adverse incidents: Prosthetic and other implants, materials and accessory devices
Y76.3|Obstetric and gynaecological devices associated with adverse incidents: Surgical instruments, materials and devices (including sutures)
Y76.8|Obstetric and gynaecological devices associated with adverse incidents: Miscellaneous devices, not elsewhere classified
Y77|Ophthalmic devices associated with adverse incidents
Y77.0|Ophthalmic devices associated with adverse incidents: Diagnostic and monitoring devices
Y77.1|Ophthalmic devices associated with adverse incidents: Therapeutic (nonsurgical) and rehabilitative devices
Y77.2|Ophthalmic devices associated with adverse incidents: Prosthetic and other implants, materials and accessory devices
Y77.3|Ophthalmic devices associated with adverse incidents: Surgical instruments, materials and devices (including sutures)
Y77.8|Ophthalmic devices associated with adverse incidents: Miscellaneous devices, not elsewhere classified
Y78|Radiological devices associated with adverse incidents
Y78.0|Radiological devices associated with adverse incidents: Diagnostic and monitoring devices
Y78.1|Radiological devices associated with adverse incidents: Therapeutic (nonsurgical) and rehabilitative devices
Y78.2|Radiological devices associated with adverse incidents: Prosthetic and other implants, materials and accessory devices
Y78.3|Radiological devices associated with adverse incidents: Surgical instruments, materials and devices (including sutures)
Y78.8|Radiological devices associated with adverse incidents: Miscellaneous devices, not elsewhere classified
Y79|Orthopaedic devices associated with adverse incidents
Y79.0|Orthopaedic devices associated with adverse incidents: Diagnostic and monitoring devices
Y79.1|Orthopaedic devices associated with adverse incidents: Therapeutic (nonsurgical) and rehabilitative devices
Y79.2|Orthopaedic devices associated with adverse incidents: Prosthetic and other implants, materials and accessory devices
Y79.3|Orthopaedic devices associated with adverse incidents: Surgical instruments, materials and devices (including sutures)
Y79.8|Orthopaedic devices associated with adverse incidents: Miscellaneous devices, not elsewhere classified
Y80|Physical medicine devices associated with adverse incidents
Y80.0|Physical medicine devices associated with adverse incidents: Diagnostic and monitoring devices
Y80.1|Physical medicine devices associated with adverse incidents: Therapeutic (nonsurgical) and rehabilitative devices
Y80.2|Physical medicine devices associated with adverse incidents: Prosthetic and other implants, materials and accessory devices
Y80.3|Physical medicine devices associated with adverse incidents: Surgical instruments, materials and devices (including sutures)
Y80.8|Physical medicine devices associated with adverse incidents: Miscellaneous devices, not elsewhere classified
Y81|General- and plastic-surgery devices associated with adverse incidents
Y81.0|General- and plastic-surgery devices associated with adverse incidents: Diagnostic and monitoring devices
Y81.1|General- and plastic-surgery devices associated with adverse incidents: Therapeutic (nonsurgical) and rehabilitative devices
Y81.2|General- and plastic-surgery devices associated with adverse incidents: Prosthetic and other implants, materials and accessory devices
Y81.3|General- and plastic-surgery devices associated with adverse incidents: Surgical instruments, materials and devices (including sutures)
Y81.8|General- and plastic-surgery devices associated with adverse incidents: Miscellaneous devices, not elsewhere classified
Y82|Other and unspecified medical devices associated with adverse incidents
Y82.0|Other and unspecified medical devices associated with adverse incidents: Diagnostic and monitoring devices
Y82.1|Other and unspecified medical devices associated with adverse incidents: Therapeutic (nonsurgical) and rehabilitative devices
Y82.2|Other and unspecified medical devices associated with adverse incidents: Prosthetic and other implants, materials and accessory devices
Y82.3|Other and unspecified medical devices associated with adverse incidents: Surgical instruments, materials and devices (including sutures)
Y82.8|Other and unspecified medical devices associated with adverse incidents: Miscellaneous devices, not elsewhere classified
Y83|Surgical operation and other surgical procedures as the cause of abnormal reaction of the patient, or of later complication, without mention of misadventure at the time of the procedure
Y83.0|Surgical operation with transplant of whole organ
Y83.1|Surgical operation with implant of artificial internal device
Y83.2|Surgical operation with anastomosis, bypass or graft
Y83.3|Surgical operation with formation of external stoma
Y83.4|Other reconstructive surgery
Y83.5|Amputation of limb(s)
Y83.6|Removal of other organ (partial) (total)
Y83.8|Other surgical procedures
Y83.9|Surgical procedure, unspecified
Y84|Other medical procedures as the cause of abnormal reaction of the patient, or of later complication, without mention of misadventure at the time of the procedure
Y84.0|Cardiac catheterization
Y84.1|Kidney dialysis
Y84.2|Radiological procedure and radiotherapy
Y84.3|Shock therapy
Y84.4|Aspiration of fluid
Y84.5|Insertion of gastric or duodenal sound
Y84.6|Urinary catheterization
Y84.7|Blood-sampling
Y84.8|Other medical procedures
Y84.9|Medical procedure, unspecified
Y85|Sequelae of transport accidents
Y85.0|Sequelae of motor-vehicle accident
Y85.9|Sequelae of other and unspecified transport accidents
Y86|Sequelae of other accidents
Y87|Sequelae of intentional self-harm, assault and events of undetermined intent
Y87.0|Sequelae of intentional self-harm
Y87.1|Sequelae of assault
Y87.2|Sequelae of events of undetermined intent
Y88|Sequelae with surgical and medical care as external cause
Y88.0|Sequelae of adverse effects caused by drugs, medicaments and biological substances in therapeutic use
Y88.1|Sequelae of misadventures to patients during surgical and medical procedures
Y88.2|Sequelae of adverse incidents associated with medical devices in diagnostic and therapeutic use
Y88.3|Sequelae of surgical and medical procedures as the cause of abnormal reaction of the patient, or of later complication, without mention of misadventure at the time of the procedure
Y89|Sequelae of other external causes
Y89.0|Sequelae of legal intervention
Y89.1|Sequelae of war operations
Y89.9|Sequelae of unspecified external cause
Y90|Evidence of alcohol involvement determined by blood alcohol level
Y90.0|Blood alcohol level of less than 20 mg/100 ml
Y90.1|Blood alcohol level of 20-39 mg/100 ml
Y90.2|Blood alcohol level of 40-59 mg/100 ml
Y90.3|Blood alcohol level of 60-79 mg/100 ml
Y90.4|Blood alcohol level of 80-99 mg/100 ml
Y90.5|Blood alcohol level of 100-119 mg/100 ml
Y90.6|Blood alcohol level of 120-199 mg/100 ml
Y90.7|Blood alcohol level of 200-239 mg/100 ml
Y90.8|Blood alcohol level of 240 mg/100 ml or more
Y90.9|Presence of alcohol in blood, level not specified
Y91|Evidence of alcohol involvement determined by level of intoxication
Y91.0|Mild alcohol intoxication
Y91.1|Moderate alcohol intoxication
Y91.2|Severe alcohol intoxication
Y91.3|Very severe alcohol intoxication
Y91.9|Alcohol involvement, not otherwise specified
Y95|Nosocomial condition
Y96|Work-related condition
Y97|Environmental-pollution-related condition
Y98|Lifestyle-related condition
Z00|General examination and investigation of persons without complaint and reported diagnosis
Z00.0|General medical examination
Z00.1|Routine child health examination
Z00.2|Examination for period of rapid growth in childhood
Z00.3|Examination for adolescent development state
Z00.4|General psychiatric examination, nec
Z00.5|Examination of potential donor of organ and tissue
Z00.6|Exam normal comparison and control in clin research program
Z00.8|Other general examinations
Z01|Other special examinations and investigations of persons without complaint or reported diagnosis
Z01.0|Examination of eyes and vision
Z01.1|Examination of ears and hearing
Z01.2|Dental examination
Z01.3|Examination of blood pressure
Z01.4|Gynaecological examination (general)(routine)
Z01.5|Diagnostic skin and sensitization tests
Z01.6|Radiological examination, nec
Z01.7|Laboratory examination
Z01.8|Other specified special examinations
Z01.9|Special examination, unspecified
Z02|Examination and encounter for administrative purposes
Z02.0|Examination for admission to educational institution
Z02.1|Pre-employment examination
Z02.2|Examination for admission to residential institutions
Z02.3|Examination for recruitment to armed forces
Z02.4|Examination for driving licence
Z02.5|Examination for participation in sport
Z02.6|Examination for insurance purposes
Z02.7|Issue of medical certificate
Z02.8|Other examinations for administrative purposes
Z02.9|Examination for administrative purposes, unspecified
Z03|Medical observation and evaluation for suspected diseases and conditions
Z03.0|Observation for suspected tuberculosis
Z03.1|Observation for suspected malignant neoplasm
Z03.2|Observation for suspected mental and behavioural disorders
Z03.3|Observation for suspected nervous system disorder
Z03.4|Observation for suspected myocardial infarction
Z03.5|Observation for other suspected cardiovascular diseases
Z03.6|Observation for suspected toxic effect from ingested substances
Z03.8|Observation for other suspected diseases and conditions
Z03.9|Observation for suspected disease or condition, unspecified
Z04|Examination and observation for other reasons
Z04.0|Blood-alcohol and blood-drug test
Z04.1|Examination and observation following transport accident
Z04.2|Examination and observation following work accident
Z04.3|Examination and observation following other accident
Z04.4|Exam and observation following alleged rape and seduction
Z04.5|Examination and observation following other inflicted injury
Z04.6|General psychiatric examination, requested by authority
Z04.8|Examination and observation for other specified reasons
Z04.9|Examination and observation for unspecified reason
Z08|Follow-up examination after treatment for malignant neoplasms
Z08.0|Follow-up examination after surgery for malignant neoplasm
Z08.1|Follow-up examination after radiotherapy for malignant neoplasm
Z08.2|Follow-up examination after chemotherapy for malignant neoplasm
Z08.7|Follow-up examination after combined treatment for malig neoplasm
Z08.8|Follow-up examination after other treatment for malignant neoplasm
Z08.9|Follow-up examination after unspecified treatment for malignant neoplasm
Z09|Follow-up examination after treatment for conditions other than malignant neoplasms
Z09.0|Follow-up examination after surgery for other conditions
Z09.1|Follow-up examination after radiotherapy for oth conditions
Z09.2|Follow-up examination after chemotherapy for oth conditions
Z09.3|Follow-up examination after psychotherapy
Z09.4|Follow-up examination after treatment of fracture
Z09.7|Follow-up exam after combined treatment for other conditions
Z09.8|Follow-up exam after other treatment for other conditions
Z09.9|Follow-up exam after unspecified treatment for other conditions
Z10|Routine general health check-up of defined subpopulation
Z10.0|Occupational health examination
Z10.1|Routine gen health check-up of inhabitants of institutions
Z10.2|Routine general health check-up of armed forces
Z10.3|Routine general health check-up of sports teams
Z10.8|Routine general health check-up of other defined subpopulations
Z11|Special screening examination for infectious and parasitic diseases
Z11.0|Special screening examination for intestinal infectious diseases
Z11.1|Special screening examination for respiratory tuberculosis
Z11.2|Special screening examination for other bacterial diseases
Z11.3|Special screening examination infection with predominantly sexual mode transmis
Z11.4|Special screening examination for human immunodeficiency virus [hiv]
Z11.5|Special screening examination for other viral diseases
Z11.6|Special screening examination for oth protozoal dis and helminthiases
Z11.8|Special screening examination for other infectious and parasitic diseases
Z11.9|Special screening examination for infectious and parasitic disease unspecified
Z12|Special screening examination for neoplasms
Z12.0|Special screening examination for neoplasm of stomach
Z12.1|Special screening examination for neoplasm of intestinal tract
Z12.2|Special screening examination for neoplasm of respiratory organs
Z12.3|Special screening examination for neoplasm of breast
Z12.4|Special screening examination for neoplasm of cervix
Z12.5|Special screening examination for neoplasm of prostate
Z12.6|Special screening examination for neoplasm of bladder
Z12.8|Special screening examination for neoplasms of other sites
Z12.9|Special screening examination for neoplasm, unspecified
Z13|Special screening examination for other diseases and disorders
Z13.0|Special screening examination disease blood and blood forming organs and certain disoders involving the immune mechanism
Z13.1|Special screening examination for diabetes mellitus
Z13.2|Special screening examination for nutritional disorders
Z13.3|Special screening examination for mental and behavioural disorders
Z13.4|Special screening examination certain development disorders in childhood
Z13.5|Special screening examination for eye and ear disorders
Z13.6|Special screening examination for cardiovascular disorders
Z13.7|Special screening examination for congenital malformations, deformations and chromosomal abnormalities
Z13.8|Special screening examination for other specified diseases and disorders
Z13.9|Special screening examination, unspecified
Z20|Contact with and exposure to communicable diseases
Z20.0|Contact with and exposure to intestinal infectious diseases
Z20.1|Contact with and exposure to tuberculosis
Z20.2|Contact with and exposure infection with a predominantly sex mode transmission
Z20.3|Contact with and exposure to rabies
Z20.4|Contact with and exposure to rubella
Z20.5|Contact with and exposure to viral hepatitis
Z20.6|Contact with and exposure to human immunodefic virus [HIV]
Z20.7|Contact with and exposure pediculosis acariasis and other infestations
Z20.8|Contact with and exposure to other communicable diseases
Z20.9|Contact with and exposure to unspecified communicable disease
Z21|Asymptomatic human immunodefic virus [hiv] infect status
Z22|Carrier of infectious disease
Z22.0|Carrier of typhoid
Z22.1|Carrier of other intestinal infectious diseases
Z22.2|Carrier of diphtheria
Z22.3|Carrier of other specified bacterial diseases
Z22.4|Carrier of infections with a predom sexual mode of transmission
Z22.5|Carrier of viral hepatitis
Z22.6|Carrier of human T-lymphotropic virus type-1 [HTLV-1] infection
Z22.8|Carrier of other infectious diseases
Z22.9|Carrier of infectious disease, unspecified
Z23|Need for immunization against single bacterial diseases
Z23.0|Need for immunization against cholera alone
Z23.1|Need for immuniz against typhoid-paratyphoid alone [TAB]
Z23.2|Need for immunization against tuberculosis [BCG]
Z23.3|Need for immunization against plague
Z23.4|Need for immunization against tularaemia
Z23.5|Need for immunization against tetanus alone
Z23.6|Need for immunization against diphtheria alone
Z23.7|Need for immunization against pertussis alone
Z23.8|Need for immunization against other single bacterial diseases
Z24|Need for immunization against certain single viral diseases
Z24.0|Need for immunization against poliomyelitis
Z24.1|Need for immunization against arthropod-borne viral encephalitis
Z24.2|Need for immunization against rabies
Z24.3|Need for immunization against yellow fever
Z24.4|Need for immunization against measles alone
Z24.5|Need for immunization against rubella alone
Z24.6|Need for immunization against viral hepatitis
Z25|Need for immunization against other single viral diseases
Z25.0|Need for immunization against mumps alone
Z25.1|Need for immunization against influenza
Z25.8|Need for immunization against oth specified single viral diseases
Z26|Need for immunization against other single infectious diseases
Z26.0|Need for immunization against leishmaniasis
Z26.8|Need for immunization against other specified single infectious diseases
Z26.9|Need for immunization against unspecified infectious disease
Z27|Need for immunization against combinations of infectious diseases
Z27.0|Need for immunization against cholera with typhoid-paratyphoid [cholera + TAB]
Z27.1|Need for immunization against diphtheria-tetanus-pertussis combined [DTP]
Z27.2|Need for immunization against diphtheria-tetanus-pertussis with typhoid-paratyph [DTP + TAB]
Z27.3|Need for immunization against diphtheria-tetanus-pertussis with poliomyelitis [DTP + polio]
Z27.4|Need for immunization against measles-mumps-rubella [MMR]
Z27.8|Need for immunization against other combinations of infectious diseases
Z27.9|Need for immunization against unspec combs of infectious diseases
Z28|Immunization not carried out
Z28.0|Immunization not carried out because of contraindication
Z28.1|Immunization not carried out because of patient's decision for reason of belief or  group pressure
Z28.2|Immunization not carried out because patient's decision for other unspecified reasons
Z28.8|Immunization not carried out for other reasons
Z28.9|Immunization not carried out for unspecified reason
Z29|Need for other prophylactic measures
Z29.0|Isolation
Z29.1|Prophylactic immunotherapy
Z29.2|Other prophylactic chemotherapy
Z29.8|Other specified prophylactic measures
Z29.9|Prophylactic measure, unspecified
Z30|Contraceptive management
Z30.0|General counselling and advice on contraception
Z30.1|Insertion of (intrauterine) contraceptive device
Z30.2|Sterilization
Z30.3|Menstrual extraction
Z30.4|Surveillance of contraceptive drugs
Z30.5|Surveillance of (intrauterine) contraceptive device
Z30.8|Other contraceptive management
Z30.9|Contraceptive management, unspecified
Z31|Procreative management
Z31.0|Tuboplasty or vasoplasty after previous sterilization
Z31.1|Artificial insemination
Z31.2|In vitro fertilization
Z31.3|Other assisted fertilization methods
Z31.4|Procreative investigation and testing
Z31.5|Genetic counselling
Z31.6|General counselling and advice on procreation
Z31.8|Other procreative management
Z31.9|Procreative management, unspecified
Z32|Pregnancy examination and test
Z32.0|Pregnancy, not (yet) confirmed
Z32.1|Pregnancy confirmed
Z33|Pregnant state, incidental
Z34|Supervision of normal pregnancy
Z34.0|Supervision of normal first pregnancy
Z34.8|Supervision of other normal pregnancy
Z34.9|Supervision of normal pregnancy, unspecified
Z35|Supervision of high-risk pregnancy
Z35.0|Supervision of pregnancy with history of infertility
Z35.1|Supervision of pregnancy with history of abortive outcome
Z35.2|Supervision of pregnancy with other poor reproductive or obstetric history
Z35.3|Supervision of pregnancy with history insufficient antenatal care
Z35.4|Supervision of pregnancy with grand multiparity
Z35.5|Supervision of elderly primigravida
Z35.6|Supervision of very young primigravida
Z35.7|Supervision of high-risk pregnancy due to social problems
Z35.8|Supervision of other high-risk pregnancies
Z35.9|Supervision of high-risk pregnancy, unspecified
Z36|Antenatal screening
Z36.0|Antenatal screening for chromosomal anomalies
Z36.1|Antenatal screening for raised alphafetoprotein level
Z36.2|Other antenatal screening based on amniocentesis
Z36.3|Antenatal screening malformation using ultrasound and other physical methods
Z36.4|Antenatal screening fetal growth retardation using ultrasound oth physical methods
Z36.5|Antenatal screening for isoimmunization
Z36.8|Other antenatal screening
Z36.9|Antenatal screening, unspecified
Z37|Outcome of delivery
Z37.0|Single live birth
Z37.1|Single stillbirth
Z37.2|Twins, both liveborn
Z37.3|Twins, one liveborn and one stillborn
Z37.4|Twins, both stillborn
Z37.5|Other multiple births, all liveborn
Z37.6|Other multiple births, some liveborn
Z37.7|Other multiple births, all stillborn
Z37.9|Outcome of delivery, unspecified
Z38|Liveborn infants according to place of birth
Z38.0|Singleton, born in hospital
Z38.1|Singleton, born outside hospital
Z38.2|Singleton, unspecified as to place of birth
Z38.3|Twin, born in hospital
Z38.4|Twin, born outside hospital
Z38.5|Twin, unspecified as to place of birth
Z38.6|Other multiple, born in hospital
Z38.7|Other multiple, born outside hospital
Z38.8|Other multiple, unspecified as to place of birth
Z39|Postpartum care and examination
Z39.0|Care and examination immediately after delivery
Z39.1|Care and examination of lactating mother
Z39.2|Routine postpartum follow-up
Z40|Prophylactic surgery
Z40.0|Prophyl surgery for risk-factors related to mal neoplasms
Z40.8|Other prophylactic surgery
Z40.9|Prophylactic surgery, unspecified
Z41|Procedures for purposes other than remedying health state
Z41.0|Hair transplant
Z41.1|Other plastic surgery for unacceptable cosmetic appearance
Z41.2|Routine and ritual circumcision
Z41.3|Ear piercing
Z41.8|Other procedures for purposes other than remedying health state
Z41.9|Procedures for purposes other than remedying health state, unspecified
Z42|Follow-up care involving plastic surgery
Z42.0|Follow-up care involving plastic surgery of head and neck
Z42.1|Follow-up care involving plastic surgery of breast
Z42.2|Follow-up care involving plastic surgery of ther parts of trunk
Z42.3|Follow-up care involving plastic surgery of upper extremity
Z42.4|Follow-up care involving plastic surgery of lower extremity
Z42.8|Follow-up care involving plastic surgery of other body part
Z42.9|Follow-up care involving plastic surgery, unspecified
Z43|Attention to artificial openings
Z43.0|Attention to tracheostomy
Z43.1|Attention to gastrostomy
Z43.2|Attention to ileostomy
Z43.3|Attention to colostomy
Z43.4|Attention to other artificial openings of digestive tract
Z43.5|Attention to cystostomy
Z43.6|Attention to other artificial openings of urinary tract
Z43.7|Attention to artificial vagina
Z43.8|Attention to other artificial openings
Z43.9|Attention to unspecified artificial opening
Z44|Fitting and adjustment of external prosthetic device
Z44.0|Fitting and adjustment of artificial arm (complete)(partial)
Z44.1|Fitting and adjustment of artificial leg (complete)(partial)
Z44.2|Fitting and adjustment of artificial eye
Z44.3|Fitting and adjustment of external breast prosthesis
Z44.8|Fitting and adjustment of other external prosthetic devices
Z44.9|Fitting and adjustment of unspecified external prosthetic device
Z45|Adjustment and management of implanted device
Z45.0|Adjustment and management of cardiac pacemaker
Z45.1|Adjustment and management of infusion pump
Z45.2|Adjustment and management of vascular access device
Z45.3|Adjustment and management of implanted hearing device
Z45.8|Adjustment and management of other implanted devices
Z45.9|Adjustment and management of unspecified implanted device
Z46|Fitting and adjustment of other devices
Z46.0|Fitting and adjustment of spectacles and contact lenses
Z46.1|Fitting and adjustment of hearing aid
Z46.2|Fitting and adjustment of other devicess related to nervous system and special senses
Z46.3|Fitting and adjustment of dental prosthetic device
Z46.4|Fitting and adjustment of orthodontic device
Z46.5|Fitting and adjustment of ileostomy and oth intestinal appliances
Z46.6|Fitting and adjustment of urinary device
Z46.7|Fitting and adjustment of orthopaedic device
Z46.8|Fitting and adjustment of other specified devices
Z46.9|Fitting and adjustment of unspecified device
Z47|Other orthopaedic follow-up care
Z47.0|Follow-up care involving removal of fracture plate and other internal fixation device
Z47.8|Other specified orthopaedic follow-up care
Z47.9|Orthopaedic follow-up care, unspecified
Z48|Other surgical follow-up care
Z48.0|Attention to surgical dressings and sutures
Z48.8|Other specified surgical follow-up care
Z48.9|Surgical follow-up care, unspecified
Z49|Care involving dialysis
Z49.0|Preparatory care for dialysis
Z49.1|Extracorporeal dialysis
Z49.2|Other dialysis
Z50|Care involving use of rehabilitation procedures
Z50.0|Cardiac rehabilitation
Z50.1|Other physical therapy
Z50.2|Alcohol rehabilitation
Z50.3|Drug rehabilitation
Z50.4|Psychotherapy, nec
Z50.5|Speech therapy
Z50.6|Orthoptic training
Z50.7|Occupational therapy and vocational rehabilitation nec
Z50.8|Care involving use of other rehabilitation procedures
Z50.9|Care involving use of rehabilitation procedure, unspecified
Z51|Other medical care
Z51.0|Radiotherapy session
Z51.1|Chemotherapy session for neoplasm
Z51.2|Other chemotherapy
Z51.3|Blood transfusion without reported diagnosis
Z51.4|Preparatory care for subsequent treatment nec
Z51.5|Palliative care
Z51.6|Desensitization to allergens
Z51.8|Other specified medical care
Z51.9|Medical care, unspecified
Z52|Donors of organs and tissues
Z52.0|Blood donor
Z52.1|Skin donor
Z52.2|Bone donor
Z52.3|Bone marrow donor
Z52.4|Kidney donor
Z52.5|Cornea donor
Z52.6|Liver donor
Z52.7|Heart donor
Z52.8|Donor of other organs and tissues
Z52.9|Donor of unspecified organ or tissue
Z53|Persons encountering health services for specific procedures, not carried out
Z53.0|Procedure not carried out because of contraindication
Z53.1|Procedure not carried out bacause patient's decision reasons belief and group pressure
Z53.2|Procedure not carried out because patient's decision for other unspecified reasons
Z53.8|Procedure not carried out for other reasons
Z53.9|Procedure not carried out, unspecified reason
Z54|Convalescence
Z54.0|Convalescence following surgery
Z54.1|Convalescence following radiotherapy
Z54.2|Convalescence following chemotherapy
Z54.3|Convalescence following psychotherapy
Z54.4|Convalescence following treatment of fracture
Z54.7|Convalescence following combined treatment
Z54.8|Convalescence following other treatment
Z54.9|Convalescence following unspecified treatment
Z55|Problems related to education and literacy
Z55.0|Illiteracy and low-level literacy
Z55.1|Schooling unavailable and unattainable
Z55.2|Failed examinations
Z55.3|Underachievement in school
Z55.4|Education maladjustment and discord with teachers and classmates
Z55.8|Other problems related to education and literacy
Z55.9|Problem related to education and literacy, unspecified
Z56|Problems related to employment and unemployment
Z56.0|Unemployment, unspecified
Z56.1|Change of job
Z56.2|Threat of job loss
Z56.3|Stressful work schedule
Z56.4|Discord with boss and workmates
Z56.5|Uncongenial work
Z56.6|Other physical and mental strain related to work
Z56.7|Other and unspecified problems related to employment
Z57|Occupational exposure to risk-factors
Z57.0|Occupational exposure to noise
Z57.1|Occupational exposure to radiation
Z57.2|Occupational exposure to dust
Z57.3|Occupational exposure to other air contaminants
Z57.4|Occupational exposure to toxic agents in agriculture
Z57.5|Occupational exposure to toxic agents in other industries
Z57.6|Occupational exposure to extreme temperature
Z57.7|Occupational exposure to vibration
Z57.8|Occupational exposure to other risk-factors
Z57.9|Occupational exposure to unspecified risk-factor
Z58|Problems related to physical environment
Z58.0|Exposure to noise
Z58.1|Exposure to air pollution
Z58.2|Exposure to water pollution
Z58.3|Exposure to soil pollution
Z58.4|Exposure to radiation
Z58.5|Exposure to other pollution
Z58.6|Inadequate drinking-water supply
Z58.7|Exposure to tobacco smoke
Z58.8|Other problems related to physical environment
Z58.9|Problem related to physical environment, unspecified
Z59|Problems related to housing and economic circumstances
Z59.0|Homelessness
Z59.1|Inadequate housing
Z59.2|Discord with neighbours, lodgers and landlord
Z59.3|Problems related to living in residential institution
Z59.4|Lack of adequate food
Z59.5|Extreme poverty
Z59.6|Low income
Z59.7|Insufficient social insurance and welfare support
Z59.8|Other problems related to housing and economic circumstances
Z59.9|Problem related to housing and economic circumstances, unspecified
Z60|Problems related to social environment
Z60.0|Problems of adjustment to life-cycle transitions
Z60.1|Atypical parenting situation
Z60.2|Living alone
Z60.3|Acculturation difficulty
Z60.4|Social exclusion and rejection
Z60.5|Target of perceived adverse discrimination and persecution
Z60.8|Other problems related to social environment
Z60.9|Problem related to social environment, unspecified
Z61|Problems related to negative life events in childhood
Z61.0|Loss of love relationship in childhood
Z61.1|Removal from home in childhood
Z61.2|Altered pattern of family relationships in childhood
Z61.3|Events resulting in loss of self-esteem in childhood
Z61.4|Problems related to alleged sexual abuse of child by person within primary support group
Z61.5|Problems related to alleged sexual abuse of child by person out primary support group
Z61.6|Problems related to alleged physical abuse of child
Z61.7|Personal frightening experience in childhood
Z61.8|Other negative life events in childhood
Z61.9|Negative life event in childhood, unspecified
Z62|Other problems related to upbringing
Z62.0|Inadequate parental supervision and control
Z62.1|Parental overprotection
Z62.2|Institutional upbringing
Z62.3|Hostility towards and scapegoating of child
Z62.4|Emotional neglect of child
Z62.5|Other problems related to neglect in upbringing
Z62.6|Inappropriate parental pressure and other abnormal qualities of upbringing
Z62.8|Other specified problems related to upbringing
Z62.9|Problem related to upbringing, unspecified
Z63|Other problems related to primary support group, including family circumstances
Z63.0|Problems in relationship with spouse or partner
Z63.1|Problems in relationship with parents and in-laws
Z63.2|Inadequate family support
Z63.3|Absence of family member
Z63.4|Disappearance and death of family member
Z63.5|Disruption of family by separation and divorce
Z63.6|Dependent relative needing care at home
Z63.7|Other stressful life events affecting family and household
Z63.8|Other specified problems related to primary support group
Z63.9|Problem related to primary support group, unspecified
Z64|Problems related to certain psychosocial circumstances
Z64.0|Problems related to unwanted pregnancy
Z64.1|Problems related to multiparity
Z64.2|Seeking and accepting physical, nutritional and chemical intervention known to be hazardous harmful
Z64.3|Seeking and accepting behavioural and psychological intervention known hazard and harmful
Z64.4|Discord with counsellors
Z65|Problems related to other psychosocial circumstances
Z65.0|Conviction in civil and criminal proceedings without imprisonment
Z65.1|Imprisonment and other incarceration
Z65.2|Problems related to release from prison
Z65.3|Problems related to other legal circumstances
Z65.4|Victim of crime and terrorism
Z65.5|Exposure to disaster, war and other hostilities
Z65.8|Other specif problems related to psychosocial circumstances
Z65.9|Problem related to unspecified psychosocial circumstances
Z70|Counselling related to sexual attitude, behaviour and orientation
Z70.0|Counselling related to sexual attitude
Z70.1|Counselling related to patient's sexual behavior and orientation
Z70.2|Counselling related to patient's sexual behavior and orientation of third party
Z70.3|Counselling related to combined concerns regarding sexual attitude, behaviour and orientation
Z70.8|Other sex counselling
Z70.9|Sex counselling, unspecified
Z71|Persons encountering health services for other counselling and medical advice, not elsewhere classified
Z71.0|Person consulting on behalf of another person
Z71.1|Person with feared complaint in whom no diagnosis is made
Z71.2|Person consulting for explanation of investigation findings
Z71.3|Dietary counselling and surveillance
Z71.4|Alcohol abuse counselling and surveillance
Z71.5|Drug abuse counselling and surveillance
Z71.6|Tobacco abuse counselling
Z71.7|Human immunodeficiency virus [HIV] counselling
Z71.8|Other specified counselling
Z71.9|Counselling, unspecified
Z72|Problems related to lifestyle
Z72.0|Tobacco use
Z72.1|Alcohol use
Z72.2|Drug use
Z72.3|Lack of physical exercise
Z72.4|Inappropriate diet and eating habits
Z72.5|High-risk sexual behaviour
Z72.6|Gambling and betting
Z72.8|Other problems related to lifestyle
Z72.9|Problem related to lifestyle, unspecified
Z73|Problems related to life-management difficulty
Z73.0|Burn-out
Z73.1|Accentuation of personality traits
Z73.2|Lack of relaxation and leisure act
Z73.3|Stress, nec
Z73.4|Inadequate social skills, nec
Z73.5|Social role conflict, nec
Z73.6|Limitation of activities due to disability
Z73.8|Other problems related to life-management difficulty
Z73.9|Problem related to life-management difficulty, unspecified
Z74|Problems related to care-provider dependency
Z74.0|Reduced mobility
Z74.1|Need for assistance with personal care
Z74.2|Need for assistance at  home and no other household member able render care
Z74.3|Need for continuous supervision
Z74.8|Other problems related to care-provider dependency
Z74.9|Problem related to care-provider dependency, unspecified
Z75|Problems related to medical facilities and other health care
Z75.0|Medical services not available in home
Z75.1|Person awaiting admission to adequate facility elsewhere
Z75.2|Other waiting period for investigation and treatment
Z75.3|Unavailability and inaccessibility of health-care facilities
Z75.4|Unavailability and inaccessibility of other helping agencies
Z75.5|Holiday relief care
Z75.8|Other problems related to medical facilities and other health care
Z75.9|Unspecified problem related to medical facilities and other health care
Z76|Persons encountering health services in other circumstances
Z76.0|Issue of repeat prescription
Z76.1|Health supervision and care of foundling
Z76.2|Health supervision and care of other healthy infant and child
Z76.3|Healthy person accompanying sick person
Z76.4|Other boarder in health-care facility
Z76.5|Malingerer [conscious simulation]
Z76.8|Persons encountering health services in other specified circumstances
Z76.9|Person encountering health services in unspecified circumstances
Z80|Family history of malignant neoplasm
Z80.0|Family history of malignant neoplasm of digestive organs
Z80.1|Family history of malignant neoplasm of trachea,  bronchus and lung
Z80.2|Family history of malignant neoplasm of other respiratory and intrathoracic orgs
Z80.3|Family history of malignant neoplasm of breast
Z80.4|Family history of malignant neoplasm of genital organs
Z80.5|Family history of malignant neoplasm of urinary tract
Z80.6|Family history of leukaemia
Z80.7|Famly history of other malignant neoplasms of lymphoid,  heematopoietic and and related tissues
Z80.8|Family history of malignant neoplasm of other organs or systems
Z80.9|Family history of malignant neoplasm, unspecified
Z81|Family history of mental and behavioural disorders
Z81.0|Family history of mental retardation
Z81.1|Family history of alcohol abuse
Z81.2|Family history of tobacco abuse
Z81.3|Family history of other psychoactive substance abuse
Z81.4|Family history of other substance abuse
Z81.8|Family history of other mental and behavioural disorders
Z82|Family history of certain disabilities and chronic diseases leading to disablement
Z82.0|Family history of epilepsy and other dis of the nervous sys
Z82.1|Family history of blindness and visual loss
Z82.2|Family history of deafness and hearing loss
Z82.3|Family history of stroke
Z82.4|Family history ischaemic heart disease and other disease of the circulatory system
Z82.5|Family history of asthma and other chronic lower respiratory disease
Z82.6|Family history of arthritis and other disease musculoskeletal system and connective tissue
Z82.7|Family history of congenital malformations, deformation and chromosomal abnorms
Z82.8|Family history of other disabilities and chronic disease leading disablement nec
Z83|Family history of other specific disorders
Z83.0|Family history of human immunodeficiency virus [HIV] disease
Z83.1|Family history of other infectious and parasitic diseases
Z83.2|Family history of disease of the blood and blood forming organs and certain disorder involving immune mechanism
Z83.3|Family history of diabetes mellitus
Z83.4|Fam hist of other endocrine, nutritional and metabolic diseases
Z83.5|Family history of eye and ear disorders
Z83.6|Family history of diseases of the respiratory system
Z83.7|Family history of diseases of the digestive system
Z84|Family history of other conditions
Z84.0|Family history of diseases of the skin and subcutaneous tissue
Z84.1|Family history of disorders of kidney and ureter
Z84.2|Family history of other diseases of the genitourinary system
Z84.3|Family history of consanguinity
Z84.8|Family history of other specified conditions
Z85|Personal history of malignant neoplasm
Z85.0|Personal history of malignant neoplasm of digestive organs
Z85.1|Personal history of malignant neoplasm of trachea, bronchus and lung
Z85.2|Personal history malignant neoplasm of other respiratory and intrathoracic organs
Z85.3|Personal history of malignant neoplasm of breast
Z85.4|Personal history of malignant neoplasm of genital organs
Z85.5|Personal history of malignant neoplasm of urinary tract
Z85.6|Personal history of leukaemia
Z85.7|Personal history of  other malignant neoplasms of lymphoid haematopoietic and related tissue
Z85.8|Personal history of malignant neoplasms of other organs and system
Z85.9|Personal history of malignant neoplasm, unspecified
Z86|Personal history of certain other diseases
Z86.0|Personal history of other neoplasms
Z86.1|Personal history of infectious and parasitic diseases
Z86.2|Personal history of disease of the blood and blood-forming organs and certain disorders involving the immune mechanism
Z86.3|Personal history of endocrine, nutritional and metabolic diseases
Z86.4|Personal history of psychoactive substance abuse
Z86.5|Personal history of other mental and behavioural disorders
Z86.6|Personal history of disease of the nervous system and sense organs
Z86.7|Personal history of diseases of the circulatory system
Z87|Personal history of other diseases and conditions
Z87.0|Personal history of diseases of the respiratory system
Z87.1|Personal history of diseases of the digestive system
Z87.2|Personal history of disease of the skin and subcutaneous tissue
Z87.3|Personal history of disease of the musculoskeletal system and connective tissue
Z87.4|Personal history of diseases of the genitourinary system
Z87.5|Personal history complications of pregnancy, childbirth and the puerperium
Z87.6|Personal history of certain conditions arising in perinatal period
Z87.7|Personal history of congenital malformations, deformations and chromosomal abnomalities
Z87.8|Personal history of other specified conditions
Z88|Personal history of allergy to drugs, medicaments and biological substances
Z88.0|Personal history of allergy to penicillin
Z88.1|Personal history of allergy to other antibiotic agents
Z88.2|Personal history of allergy to sulfonamides
Z88.3|Personal history of allergy to other anti-infective agents
Z88.4|Personal history of allergy to anaesthetic agent
Z88.5|Personal history of allergy to narcotic agent
Z88.6|Personal history of allergy to analgesic agent
Z88.7|Personal history of allergy to serum and vaccine
Z88.8|Personal history of allergy to other drugs, medicaments and biological substances
Z88.9|Personal history of allergy to unspecified drugs, medicaments and biological substances
Z89|Acquired absence of limb
Z89.0|Acquired absence of finger(s) [including thumb], unilateral
Z89.1|Acquired absence of hand and wrist
Z89.2|Acquired absence of upper limb above wrist
Z89.3|Acquired absence of both upper limbs [any level]
Z89.4|Acquired absence of foot and ankle
Z89.5|Acquired absence of leg at or below knee
Z89.6|Acquired absence of leg above knee
Z89.7|Acquired absence of both lower limbs [any level, except toes alone]
Z89.8|Acquired absence of upper and lower limbs [any level]
Z89.9|Acquired absence of limb, unspecified
Z90|Acquired absence of organs, not elsewhere classified
Z90.0|Acquired absence of part of head and neck
Z90.1|Acquired absence of breast(s)
Z90.2|Acquired absence of lung [part of]
Z90.3|Acquired absence of part of stomach
Z90.4|Acquired absence of other parts of digestive tract
Z90.5|Acquired absence of kidney
Z90.6|Acquired absence of other organs of urinary tract
Z90.7|Acquired absence of genital organ(s)
Z90.8|Acquired absence of other organs
Z91|Personal history of risk-factors, not elsewhere classified
Z91.0|Personal hist of allergy oth than to drugs and biol subs
Z91.1|Personal hist noncompliance with med treatment and regimen
Z91.2|Personal history of poor personal hygiene
Z91.3|Personal history of unhealthy sleep-wake schedule
Z91.4|Personal history of psychological trauma nec
Z91.5|Personal history of self-harm
Z91.6|Personal history of other physical trauma
Z91.8|Personal history of other specified risk-factors nec
Z92|Personal history of medical treatment
Z92.0|Personal history of contraception
Z92.1|Personal history long -term (current) use of anticoagulants
Z92.2|Personal history of long-term use of other medicaments
Z92.3|Personal history of irradiation
Z92.4|Personal history of major surgery, nec
Z92.5|Personal history of rehabilitation measures
Z92.6|Personal history of chemotheraphy for neoplastic disease
Z92.8|Personal history of other medical treatment
Z92.9|Personal history of medical treatment, unspecified
Z93|Artificial opening status
Z93.0|Tracheostomy status
Z93.1|Gastrostomy status
Z93.2|Ileostomy status
Z93.3|Colostomy status
Z93.4|Other artificial openings of gastrointestinal tract status
Z93.5|Cystostomy status
Z93.6|Other artificial openings of urinary tract status
Z93.8|Other artificial opening status
Z93.9|Artificial opening status, unspecified
Z94|Transplanted organ and tissue status
Z94.0|Kidney transplant status
Z94.1|Heart transplant status
Z94.2|Lung transplant status
Z94.3|Heart and lungs transplant status
Z94.4|Liver transplant status
Z94.5|Skin transplant status
Z94.6|Bone transplant status
Z94.7|Corneal transplant status
Z94.8|Other transplanted organ and tissue status
Z94.9|Transplanted organ and tissue status, unspecified
Z95|Presence of cardiac and vascular implants and grafts
Z95.0|Presence of cardiac pacemaker
Z95.1|Presence of aortocoronary bypass graft
Z95.2|Presence of prosthetic heart valve
Z95.3|Presence of xenogenic heart valve
Z95.4|Presence of other heart-valve replacement
Z95.5|Presence of coronary angioplasty implant and graft
Z95.8|Presence of other cardiac and vascular implants and grafts
Z95.9|Presence of cardiac and vascular implant and graft unspec act
Z96|Presence of other functional implants
Z96.0|Presence of urogenital implants
Z96.1|Presence of intraocular lens
Z96.2|Presence of otological and audiological implants
Z96.3|Presence of artificial larynx
Z96.4|Presence of endocrine implants
Z96.5|Presence of tooth-root and mandibular implants
Z96.6|Presence of orthopaedic joint implants
Z96.7|Presence of other bone and tendon implants
Z96.8|Presence of other specified functional implants
Z96.9|Presence of functional implant, unspecified
Z97|Presence of other devices
Z97.0|Presence of artificial eye
Z97.1|Presence of artificial limb (complete)(partial)
Z97.2|Presence of dental prosthetic device (complete)(partial)
Z97.3|Presence of spectacles and contact lenses
Z97.4|Presence of external hearing-aid
Z97.5|Presence of (intrauterine) contraceptive device
Z97.8|Presence of other specified devices
Z98|Other postsurgical states
Z98.0|Intestinal bypass and anastomosis status
Z98.1|Arthrodesis status
Z98.2|Presence of cerebrospinal fluid drainage device
Z98.8|Other specified postsurgical states
Z99|Dependence on enabling machines and devices, not elsewhere classified
Z99.0|Dependence on aspirator
Z99.1|Dependence on respirator
Z99.2|Dependence on renal dialysis
Z99.3|Dependence on wheelchair
Z99.8|Dependence on other enabling machines and devices
Z99.9|Dependence on unspecified enabling machine and device
M47.00|Anterior spinal and vertebral artery compression syndromes, multiple sites
M47.01|Anterior spinal and vertebral artery compression syndromes, occipito-atlanto-axial region
M47.02|Anterior spinal and vertebral artery compression syndromes, cervical region
M47.03|Anterior spinal and vertebral artery compression syndromes, cervicothoracic region
M47.04|Anterior spinal and vertebral artery compression syndromes, thoracic region
M47.05|Anterior spinal and vertebral artery compression syndromes, thoracolumbar region
M47.06|Anterior spinal and vertebral artery compression syndromes, lumbar region
M47.07|Anterior spinal and vertebral artery compression syndromes, lumbosacral region
M47.08|Anterior spinal and vertebral artery compression syndromes, sacral and sacrococcygeal region
M47.09|Anterior spinal and vertebral artery compression syndromes, site unspecified
M79.70|Fibromyalgia, multiple sites
M79.71|Fibromyalgia, shoulder region
M79.72|Fibromyalgia, upper arm
M79.73|Fibromyalgia, forearm
M79.74|Fibromyalgia, hand
M79.75|Fibromyalgia, pelvic and thigh
M79.76|Fibromyalgia, lower leg
M79.77|Fibromyalgia, ankle and foot
M79.78|Fibromyalgia, other site
M79.79|Fibromyalgia, site unspecified
P95|Fetal death of unspecified cause
U07.1|COVID-19, virus identified
U07.2|COVID-19, virus not identified
U11.9|Need for immunization against COVID-19, unspecified
U12.9|COVID-19 vacciness causing adverse effects in therapeutic use$ICD$, E'\n')) as x
where x <> ''
on conflict (kode) do update set nama = excluded.nama;

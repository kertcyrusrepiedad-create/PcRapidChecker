import { useEffect } from 'react'
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
} from 'firebase/firestore'
import { db } from './firebase'

const compatibility = {
  cpuSocket: {
    'LGA1700': ['Z790', 'Z690'],
    'AM5': ['X670', 'B650'],
    'AM4': ['X570', 'B550'],
    'LGA1200': ['Z590', 'B560'],
  },
  ramType: {
    'DDR5': ['LGA1700', 'AM5'],
    'DDR4': ['LGA1200', 'AM4'],
  },
  gpuLength: {
    'short': 330,
    'medium': 310,
    'long': 290,
  },
  gpuOptions: [
    'NVIDIA GeForce RTX 3050',
    'NVIDIA GeForce RTX 4060',
    'NVIDIA GeForce RTX 4060 Ti',
    'NVIDIA GeForce RTX 4070',
    'NVIDIA GeForce RTX 4070 Super',
    'NVIDIA GeForce RTX 4070 Ti Super',
    'NVIDIA GeForce RTX 4080 Super',
    'NVIDIA GeForce RTX 4090',
    'AMD Radeon RX 7600',
    'AMD Radeon RX 7700 XT',
    'AMD Radeon RX 7800 XT',
    'AMD Radeon RX 7900 XTX',
  ],
  ramDatabase: {
    DDR4: {
      speeds: [
        { speed: 'DDR4-2133', commonPerStick: ['4GB','8GB','16GB'], kitCapacities: ['8GB','16GB','32GB'] },
        { speed: 'DDR4-2400', commonPerStick: ['4GB','8GB','16GB'], kitCapacities: ['8GB','16GB','32GB'] },
        { speed: 'DDR4-2666', commonPerStick: ['4GB','8GB','16GB'], kitCapacities: ['8GB','16GB','32GB','64GB'] },
        { speed: 'DDR4-2933', commonPerStick: ['8GB','16GB'], kitCapacities: ['16GB','32GB','64GB'] },
        { speed: 'DDR4-3200', commonPerStick: ['8GB','16GB','32GB'], kitCapacities: ['16GB','32GB','64GB','128GB'] },
        { speed: 'DDR4-3600', commonPerStick: ['8GB','16GB','32GB'], kitCapacities: ['16GB','32GB','64GB','128GB'] },
        { speed: 'DDR4-4000', commonPerStick: ['8GB','16GB'], kitCapacities: ['16GB','32GB','64GB'] },
        { speed: 'DDR4-4266', commonPerStick: ['8GB','16GB'], kitCapacities: ['16GB','32GB'] },
        { speed: 'DDR4-4600', commonPerStick: ['8GB','16GB'], kitCapacities: ['16GB','32GB'] },
        { speed: 'DDR4-5000+', commonPerStick: ['8GB','16GB'], kitCapacities: ['16GB','32GB'] },
      ],
      recommendedSpeedsByGroup: {
        'Ryzen 1000 Series (Zen)': 'DDR4-2933',
        'Ryzen 2000 Series (Zen+)': 'DDR4-3200',
        'Ryzen 3000 Series (Zen 2)': 'DDR4-3600',
        'Ryzen 5000 Series (Zen 3)': 'DDR4-3600 CL16',
        'LGA 1200 10th Gen Comet Lake': 'DDR4-3200',
        'LGA 1200 11th Gen Rocket Lake': 'DDR4-3200',
        'LGA 1700 12th Gen Alder Lake': 'DDR4-3600',
        'LGA 1700 13th Gen Raptor Lake': 'DDR4-3600',
        'LGA 1700 14th Gen Raptor Lake Refresh': 'DDR4-3600',
      },
      typicalMaxByPlatform: {
        AM4: '128GB (4×32GB)',
        LGA1200: '128GB',
        LGA1700: '128GB–192GB (board dependent)'
      }
    },
    DDR5: {
      speeds: [
        { speed: 'DDR5-4800', commonPerStick: ['8GB','16GB','32GB'], kitCapacities: ['16GB','32GB','64GB'] },
        { speed: 'DDR5-5200', commonPerStick: ['16GB','32GB'], kitCapacities: ['32GB','64GB'] },
        { speed: 'DDR5-5600', commonPerStick: ['16GB','24GB','32GB'], kitCapacities: ['32GB','48GB','64GB'] },
        { speed: 'DDR5-6000', commonPerStick: ['16GB','24GB','32GB','48GB'], kitCapacities: ['32GB','48GB','64GB','96GB'] },
        { speed: 'DDR5-6400', commonPerStick: ['16GB','24GB','32GB'], kitCapacities: ['32GB','48GB','64GB'] },
        { speed: 'DDR5-6800', commonPerStick: ['16GB','24GB'], kitCapacities: ['32GB','48GB'] },
        { speed: 'DDR5-7200', commonPerStick: ['16GB','24GB'], kitCapacities: ['32GB','48GB'] },
        { speed: 'DDR5-7600', commonPerStick: ['16GB','24GB'], kitCapacities: ['32GB','48GB'] },
        { speed: 'DDR5-8000+', commonPerStick: ['16GB','24GB'], kitCapacities: ['32GB','48GB'] },
      ],
      recommendedSpeedsByGroup: {
        'Ryzen 7000 Series': 'DDR5-6000 EXPO',
        'Ryzen 9000 Series': 'DDR5-6000 to DDR5-6400 EXPO',
        'LGA 1700 12th Gen Alder Lake': 'DDR5-6400 to DDR5-7200 XMP',
        'LGA 1700 13th Gen Raptor Lake': 'DDR5-6400 to DDR5-7200 XMP',
        'LGA 1700 14th Gen Raptor Lake Refresh': 'DDR5-6400 to DDR5-7200 XMP',
      },
      typicalMaxByPlatform: {
        AM5: '192GB (4×48GB)',
        LGA1700: '192GB (4×48GB)'
      }
    }
  },
  motherboardDatabase: {
    'AM4 Motherboards - 300 Series': [
      'A320', 'B350', 'X370'
    ],
    'AM4 Motherboards - 400 Series': [
      'B450', 'X470'
    ],
    'AM4 Motherboards - 500 Series': [
      'A520', 'B550', 'X570'
    ],
    'AM4 Motherboards - OEM / Special': [
      'A300', 'B300', 'X300', 'PRO 500', 'PRO 560', 'PRO 565', 'B550A'
    ],
    'AM5 Motherboards - 600 Series': [
      'A620', 'B650', 'B650E', 'X670', 'X670E'
    ],
    'AM5 Motherboards - 800 Series': [
      'B840', 'B850', 'X870', 'X870E'
    ],
    'LGA1200 - Intel 400 Series': [
      'H410', 'B460', 'H470', 'Z490', 'W480'
    ],
    'LGA1200 - Intel 500 Series': [
      'H510', 'B560', 'H570', 'Z590', 'W580'
    ],
    'LGA1700 - Intel 600 Series': [
      'H610', 'B660', 'H670', 'Z690', 'W680'
    ],
    'LGA1700 - Intel 700 Series': [
      'B760', 'H770', 'Z790'
    ],
  },
  motherboardGroupsBySocket: {
    AM4: [
      'AM4 Motherboards - 300 Series',
      'AM4 Motherboards - 400 Series',
      'AM4 Motherboards - 500 Series',
      'AM4 Motherboards - OEM / Special',
    ],
    AM5: [
      'AM5 Motherboards - 600 Series',
      'AM5 Motherboards - 800 Series',
    ],
    LGA1200: [
      'LGA1200 - Intel 400 Series',
      'LGA1200 - Intel 500 Series',
    ],
    LGA1700: [
      'LGA1700 - Intel 600 Series',
      'LGA1700 - Intel 700 Series',
    ],
  },
  cpuDatabase: {
    'Ryzen 1000 Series (Zen)': [
      'AMD Ryzen 3 1200',
      'AMD Ryzen 3 1300X',
      'AMD Ryzen 5 1400',
      'AMD Ryzen 5 1500X',
      'AMD Ryzen 5 1600',
      'AMD Ryzen 5 1600X',
      'AMD Ryzen 7 1700',
      'AMD Ryzen 7 1700X',
      'AMD Ryzen 7 1800X',
    ],
    'Ryzen 2000 Series (Zen+)': [
      'AMD Ryzen 3 2200G',
      'AMD Ryzen 5 2400G',
      'AMD Ryzen 5 2600',
      'AMD Ryzen 5 2600X',
      'AMD Ryzen 7 2700',
      'AMD Ryzen 7 2700X',
    ],
    'Ryzen 3000 Series (Zen 2)': [
      'AMD Ryzen 3 3100',
      'AMD Ryzen 3 3200G',
      'AMD Ryzen 3 3300X',
      'AMD Ryzen 5 3400G',
      'AMD Ryzen 5 3500',
      'AMD Ryzen 5 3500X',
      'AMD Ryzen 5 3600',
      'AMD Ryzen 5 3600X',
      'AMD Ryzen 5 3600XT',
      'AMD Ryzen 7 3700X',
      'AMD Ryzen 7 3800X',
      'AMD Ryzen 7 3800XT',
      'AMD Ryzen 9 3900',
      'AMD Ryzen 9 3900X',
      'AMD Ryzen 9 3900XT',
      'AMD Ryzen 9 3950X',
    ],
    'Ryzen 4000 Series': [
      'AMD Ryzen 3 4100',
      'AMD Ryzen 3 4300G',
      'AMD Ryzen 5 4500',
      'AMD Ryzen 5 4600G',
      'AMD Ryzen 7 4700G',
    ],
    'Ryzen 5000 Series (Zen 3)': [
      'AMD Ryzen 5 5500',
      'AMD Ryzen 5 5500GT',
      'AMD Ryzen 5 5500X3D',
      'AMD Ryzen 5 5600',
      'AMD Ryzen 5 5600G',
      'AMD Ryzen 5 5600GT',
      'AMD Ryzen 5 5600X',
      'AMD Ryzen 5 5600X3D',
      'AMD Ryzen 7 5700',
      'AMD Ryzen 7 5700G',
      'AMD Ryzen 7 5700X',
      'AMD Ryzen 7 5700X3D',
      'AMD Ryzen 7 5800',
      'AMD Ryzen 7 5800X',
      'AMD Ryzen 7 5800X3D',
      'AMD Ryzen 9 5900',
      'AMD Ryzen 9 5900X',
      'AMD Ryzen 9 5950X',
    ],
    'Ryzen 7000 Series': [
      'AMD Ryzen 5 7500F',
      'AMD Ryzen 5 7600',
      'AMD Ryzen 5 7600X',
      'AMD Ryzen 7 7700',
      'AMD Ryzen 7 7700X',
      'AMD Ryzen 7 7800X3D',
      'AMD Ryzen 9 7900',
      'AMD Ryzen 9 7900X',
      'AMD Ryzen 9 7900X3D',
      'AMD Ryzen 9 7950X',
    ],
    'Ryzen 8000G Series': [
      'AMD Ryzen 5 8500G',
      'AMD Ryzen 5 8600G',
      'AMD Ryzen 7 8700G',
    ],
    'Ryzen 9000 Series': [
      'AMD Ryzen 5 9600X',
      'AMD Ryzen 7 9700X',
      'AMD Ryzen 7 9800X3D',
      'AMD Ryzen 9 9900X',
      'AMD Ryzen 9 9900X3D',
      'AMD Ryzen 9 9950X',
      'AMD Ryzen 9 9950X3D',
      'AMD Ryzen 5 9600',
      'AMD Ryzen 7 9700',
    ],
    'LGA 1200 11th Gen Rocket Lake': [
      'Intel Core i9-11900',
      'Intel Core i9-11900F',
      'Intel Core i9-11900K',
      'Intel Core i9-11900KF',
      'Intel Core i7-11700',
      'Intel Core i7-11700F',
      'Intel Core i7-11700K',
      'Intel Core i7-11700KF',
      'Intel Core i5-11400',
      'Intel Core i5-11400F',
      'Intel Core i5-11500',
      'Intel Core i5-11600',
      'Intel Core i5-11600K',
      'Intel Core i5-11600KF',
      'Intel Core i3-11100',
      'Intel Core i3-11100F',
      'Intel Core i3-11200',
      'Intel Core i3-11200F',
      'Intel Core i3-11300',
      'Intel Core i3-11320',
    ],
    'LGA 1200 10th Gen Comet Lake': [
      'Intel Core i9-10900',
      'Intel Core i9-10900F',
      'Intel Core i9-10900K',
      'Intel Core i9-10900KF',
      'Intel Core i9-10850K',
      'Intel Core i7-10700',
      'Intel Core i7-10700F',
      'Intel Core i7-10700K',
      'Intel Core i7-10700KF',
      'Intel Core i5-10400',
      'Intel Core i5-10400F',
      'Intel Core i5-10500',
      'Intel Core i5-10600',
      'Intel Core i5-10600K',
      'Intel Core i5-10600KF',
      'Intel Core i3-10100',
      'Intel Core i3-10100F',
      'Intel Core i3-10105',
      'Intel Core i3-10105F',
      'Intel Core i3-10300',
      'Intel Core i3-10320',
      'Intel Pentium Gold G6400',
      'Intel Pentium Gold G6405',
      'Intel Pentium Gold G6500',
      'Intel Pentium Gold G6600',
      'Intel Celeron G5900',
      'Intel Celeron G5905',
      'Intel Celeron G5920',
    ],
    'LGA 1700 12th Gen Alder Lake': [
      'Intel Core i9-12900',
      'Intel Core i9-12900F',
      'Intel Core i9-12900K',
      'Intel Core i9-12900KF',
      'Intel Core i9-12900KS',
      'Intel Core i7-12700',
      'Intel Core i7-12700F',
      'Intel Core i7-12700K',
      'Intel Core i7-12700KF',
      'Intel Core i5-12400',
      'Intel Core i5-12400F',
      'Intel Core i5-12500',
      'Intel Core i5-12600',
      'Intel Core i5-12600K',
      'Intel Core i5-12600KF',
      'Intel Core i3-12100',
      'Intel Core i3-12100F',
      'Intel Core i3-12300',
      'Intel Core i3-12300T',
    ],
    'LGA 1700 13th Gen Raptor Lake': [
      'Intel Core i9-13900',
      'Intel Core i9-13900F',
      'Intel Core i9-13900K',
      'Intel Core i9-13900KF',
      'Intel Core i7-13700',
      'Intel Core i7-13700F',
      'Intel Core i7-13700K',
      'Intel Core i7-13700KF',
      'Intel Core i5-13400',
      'Intel Core i5-13400F',
      'Intel Core i5-13500',
      'Intel Core i5-13600',
      'Intel Core i5-13600K',
      'Intel Core i5-13600KF',
    ],
    'LGA 1700 14th Gen Raptor Lake Refresh': [
      'Intel Core i9-14900',
      'Intel Core i9-14900F',
      'Intel Core i9-14900K',
      'Intel Core i9-14900KF',
      'Intel Core i9-14900KS',
      'Intel Core i7-14700',
      'Intel Core i7-14700F',
      'Intel Core i7-14700K',
      'Intel Core i7-14700KF',
      'Intel Core i5-14400',
      'Intel Core i5-14400F',
      'Intel Core i5-14500',
      'Intel Core i5-14600',
      'Intel Core i5-14600K',
      'Intel Core i5-14600KF',
      'Intel Core i3-14100',
      'Intel Core i3-14100F',
    ],
  },
  cpuModelGroupsBySocket: {
    AM4: [
      'Ryzen 1000 Series (Zen)',
      'Ryzen 2000 Series (Zen+)',
      'Ryzen 3000 Series (Zen 2)',
      'Ryzen 4000 Series',
      'Ryzen 5000 Series (Zen 3)',
    ],
    AM5: [
      'Ryzen 7000 Series',
      'Ryzen 8000G Series',
      'Ryzen 9000 Series',
    ],
    LGA1200: [
      'LGA 1200 10th Gen Comet Lake',
      'LGA 1200 11th Gen Rocket Lake',
    ],
    LGA1700: [
      'LGA 1700 12th Gen Alder Lake',
      'LGA 1700 13th Gen Raptor Lake',
      'LGA 1700 14th Gen Raptor Lake Refresh',
    ],
  },
}

const BUILD_COLLECTION = 'builds'

const BuildStore = (function () {
  let builds = []
  let unsubscribe = null
  const listeners = new Set()

  try { builds = JSON.parse(localStorage.getItem('savedBuilds') || '[]') || [] } catch (e) { builds = [] }

  function persist() {
    try { localStorage.setItem('savedBuilds', JSON.stringify(builds)) } catch (e) {}
    notify()
  }

  function notify() {
    const snapshot = builds.slice()
    listeners.forEach((fn) => { try { fn(snapshot) } catch (e) {} })
  }

  function syncFromFirestore() {
    if (!db || typeof window === 'undefined') return

    const q = query(collection(db, BUILD_COLLECTION), orderBy('createdAt', 'desc'))
    if (unsubscribe) unsubscribe()
    unsubscribe = onSnapshot(q, (snapshot) => {
      const remoteBuilds = snapshot.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }))
      builds = remoteBuilds
      persist()
    }, (error) => {
      console.error('Firestore sync failed:', error)
      try { builds = JSON.parse(localStorage.getItem('savedBuilds') || '[]') || [] } catch (e) { builds = [] }
      notify()
    })
  }

  if (typeof window !== 'undefined') {
    syncFromFirestore()
  }

  return {
    list() { return builds.slice() },
    async create(build) {
      const payload = { ...build, createdAt: serverTimestamp() }
      try {
        const docRef = await addDoc(collection(db, BUILD_COLLECTION), payload)
        const next = { id: docRef.id, ...build, createdAt: new Date().toISOString() }
        builds = [next, ...builds.filter((item) => item.id !== next.id)]
        persist()
        return next
      } catch (error) {
        console.error('Failed to save build to Firestore:', error)
        const next = { ...build, id: Date.now() }
        builds = [next, ...builds]
        persist()
        return next
      }
    },
    async update(id, build) {
      const payload = { ...build, updatedAt: serverTimestamp() }
      try {
        await updateDoc(doc(db, BUILD_COLLECTION, id), payload)
        builds = builds.map((b) => (b.id === id ? { ...b, ...build, id, updatedAt: new Date().toISOString() } : b))
        persist()
        return builds.find((b) => b.id === id)
      } catch (error) {
        console.error('Failed to update build in Firestore:', error)
        builds = builds.map((b) => (b.id === id ? { ...build, id } : b))
        persist()
        return builds.find((b) => b.id === id)
      }
    },
    async delete(id) {
      try {
        await deleteDoc(doc(db, BUILD_COLLECTION, id))
        builds = builds.filter((b) => b.id !== id)
        persist()
      } catch (error) {
        console.error('Failed to delete build from Firestore:', error)
        builds = builds.filter((b) => b.id !== id)
        persist()
      }
    },
    subscribe(fn) { listeners.add(fn); try { fn(builds.slice()) } catch (e) {}; return () => listeners.delete(fn) },
  }
})()

if (typeof window !== 'undefined') {
  window.Builds = BuildStore
  window.Compatibility = compatibility
}

function App() {
  useEffect(() => {
    const cpuSocketSelect = document.getElementById('cpuSocket')
    const cpuModelSelect = document.getElementById('cpuModel')
    const boardSelect = document.getElementById('motherboard')
    const memorySelect = document.getElementById('memoryType')
    const gpuBestEl = document.getElementById('gpuBest')
    const checkButton = document.getElementById('checkButton')
    const resultBox = document.getElementById('result')
    if (!cpuSocketSelect || !cpuModelSelect || !boardSelect || !memorySelect || !gpuBestEl || !checkButton || !resultBox) {
      return
    }

    function getSelectedCpuSocket() {
      return cpuSocketSelect.value || 'LGA1700'
    }

    function populateCpuModelOptions(selectedSocket) {
      cpuModelSelect.innerHTML = ''
      const groups = compatibility.cpuModelGroupsBySocket[selectedSocket] || []

      groups.forEach((group) => {
        const models = compatibility.cpuDatabase[group]
        if (!models?.length) {
          return
        }

        const optgroup = document.createElement('optgroup')
        optgroup.label = group

        models.forEach((model) => {
          const option = document.createElement('option')
          option.value = model
          option.textContent = model
          optgroup.appendChild(option)
        })

        cpuModelSelect.appendChild(optgroup)
      })

      const firstOption = cpuModelSelect.querySelector('option')
      if (firstOption) {
        firstOption.selected = true
      }
    }

    function populateMotherboardOptions(selectedSocket) {
      boardSelect.innerHTML = ''
      const groups = compatibility.motherboardGroupsBySocket[selectedSocket] || []

      groups.forEach((group) => {
        const boards = compatibility.motherboardDatabase[group]
        if (!boards?.length) return

        const optgroup = document.createElement('optgroup')
        optgroup.label = group

        boards.forEach((b) => {
          const option = document.createElement('option')
          option.value = b
          option.textContent = b
          optgroup.appendChild(option)
        })

        boardSelect.appendChild(optgroup)
      })

      const first = boardSelect.querySelector('option')
      if (first) first.selected = true
    }

    function populateMemoryTypeOptions(selectedSocket) {
      memorySelect.innerHTML = ''
      // determine available memory types for this socket
      const types = Object.keys(compatibility.ramDatabase).filter((type) => {
        // check if compatibility.ramType maps this type to include the socket
        return compatibility.ramType[type]?.includes(selectedSocket)
      })

      // fallback: if none found, present both
      const toAdd = types.length ? types : Object.keys(compatibility.ramDatabase)
      toAdd.forEach((t) => {
        const opt = document.createElement('option')
        opt.value = t
        opt.textContent = t
        memorySelect.appendChild(opt)
      })

      const first = memorySelect.querySelector('option')
      if (first) first.selected = true
    }

    function renderRamInfo(selectedSocket, selectedType) {
      const ramInfo = document.getElementById('ramInfo')
      if (!ramInfo) return
      const db = compatibility.ramDatabase[selectedType]
      if (!db) {
        ramInfo.textContent = ''
        return
      }

      const cpuGroup = cpuModelSelect.selectedOptions?.[0]?.parentElement?.label || ''
      const recommended = db.recommendedSpeedsByGroup[cpuGroup] || db.recommendedSpeedsByGroup[selectedSocket] || 'See platform docs'

      // Build a concise info summary
      const speeds = db.speeds.slice(0,5).map(s => s.speed).join(', ')
      const typical = db.typicalMaxByPlatform[selectedSocket] || 'Varies by board'

      ramInfo.innerHTML = `<strong>Common speeds:</strong> ${speeds}<br/><strong>Recommended:</strong> ${recommended}<br/><strong>Typical max:</strong> ${typical}`
    }

    function checkCompatibility() {
      const cpuSocket = getSelectedCpuSocket()
      const cpuModel = cpuModelSelect.value
      const motherboard = boardSelect.value
      const memoryType = memorySelect.value

      const groups = compatibility.motherboardGroupsBySocket[cpuSocket] || []
      const supportedBoards = groups.reduce((acc, g) => acc.concat(compatibility.motherboardDatabase[g] || []), [])
      const socketMatch = supportedBoards.includes(motherboard)
      const memoryMatch = compatibility.ramType[memoryType]?.includes(cpuSocket) ?? false

      const messages = []

      if (!socketMatch) {
        messages.push(`- ${cpuSocket} CPUs are not normally paired with ${motherboard} motherboards.`)
      }
      if (!memoryMatch) {
        messages.push(`- ${memoryType} RAM is not compatible with ${cpuSocket} socket CPUs.`)
      }

      function getCpuTier(model) {
        const normalized = String(model).toLowerCase().replace(/\s+/g, ' ')
        const top = /(14900ks|9950x3d|9950x|9800x3d|7950x3d|7800x3d|9900x3d)/
        const high = /(10850k|11700k|12700k|13700k|14700k|12900k|13900k|14900k|5800x3d|7800x3d|5900x|7950x|9900x|7900x|7900xtx)/
        const upper = /(12600k|13600k|14600k|7600x|7600|5800x|7700|3700x|5600x|4070 ti super|4070 super|7800 xt)/
        const mid = /(10400|11400|12400|13400|1600|2600|3600|4500|5500|5600|5600x|2700|3700x)/
        const entry = /(ryzen 3 1200|ryzen 3 1300x|ryzen 3 2200g|ryzen 3 3100|ryzen 3 4100|core i3-10100|core i3-10105|core i3-12100|core i3-14100|core i5-10400|core i5-11400)/
        if (top.test(normalized)) return 'top'
        if (high.test(normalized)) return 'high'
        if (upper.test(normalized)) return 'upper'
        if (mid.test(normalized)) return 'mid'
        if (entry.test(normalized)) return 'entry'
        return 'mid'
      }

      function recommendGpuForCpu(cpuModel) {
        const tier = getCpuTier(cpuModel)
        switch (tier) {
          case 'entry':
            return 'NVIDIA GeForce RTX 3050 / NVIDIA GeForce RTX 4060 / AMD Radeon RX 7600'
          case 'mid':
            return 'NVIDIA GeForce RTX 4060 Ti / NVIDIA GeForce RTX 4070 / AMD Radeon RX 7700 XT'
          case 'upper':
            return 'NVIDIA GeForce RTX 4070 Super / NVIDIA GeForce RTX 4070 Ti Super / AMD Radeon RX 7800 XT'
          case 'high':
            return 'NVIDIA GeForce RTX 4080 Super / AMD Radeon RX 7900 XTX'
          case 'top':
            return 'NVIDIA GeForce RTX 4090 / NVIDIA GeForce RTX 5090 / AMD Radeon RX 7900 XTX'
          default:
            return 'NVIDIA GeForce RTX 4070 / AMD Radeon RX 7800 XT'
        }
      }

      const cpuTier = getCpuTier(cpuModel)
      const recommendedGpu = recommendGpuForCpu(cpuModel)
      if (gpuBestEl) gpuBestEl.textContent = recommendedGpu

      function estimateCpuWatts(cpuModel) {
        const tier = getCpuTier(cpuModel)
        switch (tier) {
          case 'entry':
            return 65
          case 'mid':
            return 95
          case 'upper':
            return 125
          case 'high':
            return 150
          case 'top':
            return 220
          default:
            return 95
        }
      }

      function estimateGpuWattsForTier(tier) {
        switch (tier) {
          case 'entry':
            return 130
          case 'mid':
            return 225
          case 'upper':
            return 285
          case 'high':
            return 340
          case 'top':
            return 450
          default:
            return 250
        }
      }

      function getPsuRecommendation(tier) {
        const data = {
          entry: {
            range: '450W–550W',
            efficiency: 'Bronze minimum / Gold recommended',
            example: '550W',
          },
          mid: {
            range: '600W–650W',
            efficiency: 'Gold recommended',
            example: '650W',
          },
          upper: {
            range: '650W–750W',
            efficiency: 'Gold or Platinum',
            example: '750W',
          },
          high: {
            range: '750W–850W',
            efficiency: 'Gold minimum / Platinum ideal',
            example: '850W',
          },
          top: {
            range: '1000W–1200W+',
            efficiency: 'Platinum recommended (Gold acceptable)',
            example: '1200W',
          },
        }
        return data[tier] || data.mid
      }

      const cpuWatts = estimateCpuWatts(cpuModel)
      const gpuWatts = estimateGpuWattsForTier(cpuTier)
      const recommendedPsu = getPsuRecommendation(cpuTier)
      const psuText = `${recommendedPsu.range} recommended — estimated CPU ${cpuWatts}W + GPU ${gpuWatts}W. Efficiency: ${recommendedPsu.efficiency}`
      const psuEl = document.getElementById('psuRec')
      if (psuEl) psuEl.textContent = psuText

      // Build pairing recommendations
      const ramDb = compatibility.ramDatabase[memoryType]
      const selectedCpuGroup = cpuModelSelect.selectedOptions?.[0]?.parentElement?.label || ''
      const recommendedRam = ramDb?.recommendedSpeedsByGroup[selectedCpuGroup] || ramDb?.recommendedSpeedsByGroup[cpuSocket] || (ramDb?.speeds?.[0]?.speed) || ''

      const recommendations = []
      if (recommendedRam) recommendations.push(`Recommended RAM: ${recommendedRam}`)
      if (recommendedGpu) recommendations.push(`Recommended GPU: ${recommendedGpu}`)
      if (recommendedPsu) recommendations.push(`Recommended PSU: ${recommendedPsu.range} (${recommendedPsu.efficiency})`)

      if (messages.length === 0) {
        resultBox.textContent = `${cpuModel} looks compatible with this build configuration.\n\n${recommendations.join('\n')}`
        resultBox.style.color = '#d1ffd6'
      } else {
        resultBox.textContent = `Compatibility notes for ${cpuModel}:\n${messages.join('\n')}\n\n${recommendations.join('\n')}`
        resultBox.style.color = '#ffd1d1'
      }
    }

    populateCpuModelOptions(getSelectedCpuSocket())
    populateMotherboardOptions(getSelectedCpuSocket())
    populateMemoryTypeOptions(getSelectedCpuSocket())
    renderRamInfo(getSelectedCpuSocket(), memorySelect.value)

    const socketChangeHandler = () => {
      populateCpuModelOptions(getSelectedCpuSocket())
      populateMotherboardOptions(getSelectedCpuSocket())
      populateMemoryTypeOptions(getSelectedCpuSocket())
      renderRamInfo(getSelectedCpuSocket(), memorySelect.value)
      checkCompatibility()
    }
    cpuSocketSelect.addEventListener('change', socketChangeHandler)

    memorySelect.addEventListener('change', () => renderRamInfo(getSelectedCpuSocket(), memorySelect.value))

    checkButton.addEventListener('click', checkCompatibility)
    return () => {
      checkButton.removeEventListener('click', checkCompatibility)
      cpuSocketSelect.removeEventListener('change', socketChangeHandler)
    }
  }, [])

  return null
}

export default App

export interface DeviceQualityProfile {
  maxDeviceDpr: number
  reduceAnimations: boolean
}

function isMobileAgent() {
  if (typeof navigator === 'undefined') return false
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
}

export function detectDeviceQuality(): DeviceQualityProfile {
  const mobile = isMobileAgent()
  const hardwareConcurrency = typeof navigator !== 'undefined' ? navigator.hardwareConcurrency ?? 4 : 4
  const deviceMemory = typeof navigator !== 'undefined' ? (navigator as Navigator & { deviceMemory?: number }).deviceMemory ?? 8 : 8

  let maxDeviceDpr = mobile ? 1.5 : 2.2

  if (deviceMemory <= 4) {
    maxDeviceDpr = Math.min(maxDeviceDpr, 1.4)
  }
  if (hardwareConcurrency <= 4) {
    maxDeviceDpr = Math.min(maxDeviceDpr, mobile ? 1.25 : 1.6)
  }
  if (hardwareConcurrency <= 2) {
    maxDeviceDpr = Math.min(maxDeviceDpr, 1.2)
  }

  return {
    maxDeviceDpr,
    reduceAnimations: hardwareConcurrency <= 4 || deviceMemory <= 4
  }
}



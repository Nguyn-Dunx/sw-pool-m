let lockCount = 0
let previousOverflow = ''

export function lockScroll() {
  lockCount += 1
  if (lockCount === 1) {
    previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
  }
}

export function unlockScroll() {
  lockCount = Math.max(0, lockCount - 1)
  if (lockCount === 0) {
    document.body.style.overflow = previousOverflow
  }
}
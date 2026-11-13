import { useRef } from 'react'
import gsap from 'gsap'
import { useGSAP } from '@gsap/react'

gsap.registerPlugin(useGSAP)

/**
 * PageTransition — entrance nhẹ cho mỗi trang + stagger cho phần tử [data-stagger].
 * Chỉ chạy khi người dùng không bật prefers-reduced-motion; tự cleanup qua useGSAP.
 */
export function PageTransition({ children, className = '' }) {
  const scope = useRef(null)

  useGSAP(() => {
    const mm = gsap.matchMedia()
    mm.add('(prefers-reduced-motion: no-preference)', () => {
      gsap.fromTo(scope.current,
        { opacity: 0, y: 10 },
        { opacity: 1, y: 0, duration: 0.32, ease: 'power2.out', clearProps: 'opacity,transform' }
      )
      const items = scope.current.querySelectorAll('[data-stagger]')
      if (items.length > 0) {
        gsap.fromTo(items,
          { opacity: 0, y: 14 },
          { opacity: 1, y: 0, duration: 0.38, stagger: 0.055, delay: 0.06, ease: 'power2.out', clearProps: 'opacity,transform' }
        )
      }
    })
    return () => mm.revert()
  }, { scope })

  return (
    <div ref={scope} className={className}>
      {children}
    </div>
  )
}

/**
 * StaggerList — entrance cho danh sách render bất đồng bộ (bảng, card grid).
 * Chạy lại khi `deps` đổi (vd: hết loading), chỉ animate transform/opacity.
 */
export function StaggerList({ children, deps = [], selector = '[data-stagger-item]', className = '' }) {
  const scope = useRef(null)

  useGSAP(() => {
    const mm = gsap.matchMedia()
    mm.add('(prefers-reduced-motion: no-preference)', () => {
      const items = scope.current.querySelectorAll(selector)
      if (items.length > 0) {
        gsap.fromTo(items,
          { opacity: 0, y: 10 },
          { opacity: 1, y: 0, duration: 0.3, stagger: 0.03, ease: 'power2.out', clearProps: 'opacity,transform', overwrite: 'auto' }
        )
      }
    })
    return () => mm.revert()
  }, { scope, dependencies: deps })

  return (
    <div ref={scope} className={className}>
      {children}
    </div>
  )
}
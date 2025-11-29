import React, { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

type Role = 'restaurant' | 'shopping' | 'station' | 'hotel'

interface CharacterAvatarProps {
  role: Role
  isTalking?: boolean
  size?: 'normal' | 'large'
}

const ROLE_STYLES: Record<
  Role,
  {
    accent: string
    bg: string
    glow: string
    icon: string
    title: string
  }
> = {
  restaurant: {
    accent: 'from-emerald-400 to-emerald-600',
    bg: 'bg-gradient-to-br from-emerald-50 to-emerald-100',
    glow: 'rgba(16,185,129,0.18)',
    icon: '👨‍🍳',
    title: 'Nhân viên nhà hàng'
  },
  shopping: {
    accent: 'from-blue-400 to-blue-600',
    bg: 'bg-gradient-to-br from-sky-50 to-sky-100',
    glow: 'rgba(59,130,246,0.18)',
    icon: '🛍️',
    title: 'Nhân viên cửa hàng'
  },
  station: {
    accent: 'from-violet-400 to-violet-600',
    bg: 'bg-gradient-to-br from-violet-50 to-violet-100',
    glow: 'rgba(139,92,246,0.14)',
    icon: '🚉',
    title: 'Nhân viên ga tàu'
  },
  hotel: {
    accent: 'from-pink-400 to-pink-600',
    bg: 'bg-gradient-to-br from-pink-50 to-pink-100',
    glow: 'rgba(236,72,153,0.14)',
    icon: '🏨',
    title: 'Lễ tân khách sạn'
  }
}

export default function CharacterAvatar({ role, isTalking = false, size = 'normal' }: CharacterAvatarProps) {
  const [blink, setBlink] = useState(false)
  const [microMove, setMicroMove] = useState(false)
  const style = ROLE_STYLES[role]
  
  const sizeClasses = size === 'large' ? 'w-96' : 'w-72'
  const avatarSize = size === 'large' ? 'w-40 h-40' : 'w-28 h-28'
  const iconSize = size === 'large' ? 'w-32 h-32' : 'w-20 h-20'
  const emojiSize = size === 'large' ? 'text-6xl' : 'text-4xl'

  // Random blinking with slight humanization
  useEffect(() => {
    let mounted = true
    function scheduleBlink() {
      if (!mounted) return
      const next = 2500 + Math.random() * 2500
      setTimeout(() => {
        setBlink(true)
        setTimeout(() => setBlink(false), 120)
        scheduleBlink()
      }, next)
    }
    scheduleBlink()
    return () => {
      mounted = false
    }
  }, [])

  // Micro mouth/nod when talking
  useEffect(() => {
    if (!isTalking) return
    setMicroMove(true)
    const id = setInterval(() => setMicroMove((s) => !s), 300)
    return () => clearInterval(id)
  }, [isTalking])

  return (
    <div
      role="article"
      aria-label={`${style.title} avatar`}
      className={`${sizeClasses} rounded-2xl p-5 shadow-2xl relative overflow-hidden ${style.bg} border-2 border-transparent`}
      style={{
        boxShadow: `0 18px 40px ${style.glow}`
      }}
    >
      {/* Decorative floating shapes */}
      <div className="pointer-events-none absolute -left-6 -top-6 w-36 h-36 rounded-full opacity-40" style={{ background: `linear-gradient(135deg, rgba(255,255,255,0.12), transparent)` }} />
      <div className="pointer-events-none absolute -right-8 bottom-0 w-44 h-44 rounded-full opacity-30" style={{ background: `radial-gradient(circle at 30% 30%, rgba(255,255,255,0.08), transparent 40%)` }} />

      {/* Icon badge */}
      <div className="absolute right-4 top-4 bg-white/90 rounded-full p-2 border shadow" style={{ borderColor: 'rgba(255,255,255,0.6)' }}>
        <span className="text-lg">{style.icon}</span>
      </div>

      <div className="flex flex-col items-center gap-3 z-10 relative">
        {/* Avatar */}
        <motion.div
          animate={isTalking ? { scale: 1.06 } : { scale: 1 }}
          transition={{ type: 'spring', stiffness: 220, damping: 18 }}
          className="relative"
        >
          {/* Glow ring when talking */}
          <AnimatePresence>
            {isTalking && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 0.55, scale: 1.35 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.9, repeat: Infinity, repeatType: 'reverse', ease: 'easeInOut' }}
                className="absolute inset-0 rounded-full"
                style={{ background: `radial-gradient(circle, ${style.glow}, transparent 40%)`, zIndex: 0 }}
              />
            )}
          </AnimatePresence>

          <div className={`${avatarSize} rounded-full bg-white p-2 flex items-center justify-center z-20`} style={{ boxShadow: `0 10px 24px ${style.glow}` }}>
            <div className={`w-full h-full rounded-full flex items-center justify-center border-4 border-white`}>
              <motion.div
                className={`${iconSize} rounded-full flex items-center justify-center bg-gradient-to-br ${style.accent}`}
                animate={blink ? { filter: 'brightness(0.86)' } : { filter: 'brightness(1)' }}
                transition={{ duration: 0.12 }}
                style={{ boxShadow: 'inset 0 -6px 14px rgba(0,0,0,0.12), 0 8px 20px rgba(0,0,0,0.08)' }}
              >
                <span className={`${emojiSize} transform ${microMove ? 'translate-y-0.5 scale-105' : ''}`}>{style.icon}</span>
              </motion.div>
            </div>
          </div>
        </motion.div>

        {/* Name / role badge */}
        <div className="px-3 py-1 rounded-lg bg-white shadow-sm border" style={{ borderColor: 'rgba(255,255,255,0.6)' }}>
          <div className={`text-sm font-semibold text-center`} style={{ color: undefined }}>{style.title}</div>
        </div>

        {/* Talking dots + accessible live region */}
        <div className="flex items-center gap-2">
          <AnimatePresence>
            {isTalking ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.18 }}
                className="flex gap-2 bg-white rounded-full px-3 py-1 shadow-sm items-center"
              >
                {[0, 1, 2].map((i) => (
                  <motion.span
                    key={i}
                    animate={{ y: [0, -8, 0] }}
                    transition={{ repeat: Infinity, duration: 0.9, delay: i * 0.12, ease: 'easeInOut' }}
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ background: `linear-gradient(180deg, rgba(255,255,255,0.9), rgba(0,0,0,0.05)), rgba(255,255,255,0.6)` }}
                  />
                ))}
              </motion.div>
            ) : (
              <div className="text-xs text-gray-500">{isTalking ? 'Đang nói...' : 'Sẵn sàng'} </div>
            )}
          </AnimatePresence>
        </div>

        {/* Role-specific helper text (compact) */}
        <div className="text-xs text-center text-gray-600 px-2">
          {role === 'restaurant' && 'Chào khách — hỏi số người, gợi ý món.'}
          {role === 'shopping' && 'Hỏi size / màu, giới thiệu sản phẩm phù hợp.'}
          {role === 'station' && 'Hỏi điểm đến — báo giá — giờ tàu gần nhất.'}
          {role === 'hotel' && 'Hỏi tên — xác nhận đặt phòng — giới thiệu tiện nghi.'}
        </div>
      </div>

      {/* Small styles to improve smoothing on some browsers */}
      <style>{`
        .shadow-2xl { box-shadow: 0 20px 50px rgba(2,6,23,0.08); }
        .border { border-width: 1px; }
      `}</style>
    </div>
  )
}

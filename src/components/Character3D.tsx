import { useRef, Suspense } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Sphere, Box, Cylinder } from '@react-three/drei';
import * as THREE from 'three';

interface Character3DProps {
  color: string;
  isThinking: boolean;
  isTalking: boolean;
}

function CharacterModel({ color, isThinking, isTalking }: Character3DProps) {
  const groupRef = useRef<THREE.Group>(null);
  const headRef = useRef<THREE.Mesh>(null);
  const leftEyeRef = useRef<THREE.Mesh>(null);
  const rightEyeRef = useRef<THREE.Mesh>(null);
  const mouthRef = useRef<THREE.Mesh>(null);
  
  // Idle animation
  useFrame((state) => {
    if (groupRef.current) {
      // Breathing animation
      groupRef.current.position.y = Math.sin(state.clock.elapsedTime * 2) * 0.1;
      
      if (isThinking) {
        // Thinking animation - slight head tilt
        groupRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 3) * 0.1;
      } else {
        groupRef.current.rotation.y = 0;
      }
    }
    
    // Head bob
    if (headRef.current) {
      headRef.current.rotation.z = Math.sin(state.clock.elapsedTime * 2) * 0.05;
    }
    
    // Eye blink
    if (leftEyeRef.current && rightEyeRef.current) {
      const blinkTime = Math.floor(state.clock.elapsedTime * 2) % 5;
      const blinkScale = blinkTime === 0 ? 0.1 : 1;
      leftEyeRef.current.scale.y = blinkScale;
      rightEyeRef.current.scale.y = blinkScale;
    }
    
    // Mouth animation when talking
    if (mouthRef.current && isTalking) {
      mouthRef.current.scale.x = 1 + Math.sin(state.clock.elapsedTime * 10) * 0.2;
    }
  });

  return (
    <group ref={groupRef}>
      {/* Head */}
      <Sphere ref={headRef} args={[1, 32, 32]} position={[0, 1.5, 0]}>
        <meshStandardMaterial color={color} />
      </Sphere>
      
      {/* Eyes */}
      <Sphere ref={leftEyeRef} args={[0.15, 16, 16]} position={[-0.3, 1.7, 0.8]}>
        <meshStandardMaterial color="#ffffff" />
      </Sphere>
      <Sphere args={[0.08, 16, 16]} position={[-0.3, 1.7, 0.88]}>
        <meshStandardMaterial color="#000000" />
      </Sphere>
      
      <Sphere ref={rightEyeRef} args={[0.15, 16, 16]} position={[0.3, 1.7, 0.8]}>
        <meshStandardMaterial color="#ffffff" />
      </Sphere>
      <Sphere args={[0.08, 16, 16]} position={[0.3, 1.7, 0.88]}>
        <meshStandardMaterial color="#000000" />
      </Sphere>
      
      {/* Mouth */}
      <Box ref={mouthRef} args={[0.4, 0.1, 0.1]} position={[0, 1.3, 0.9]}>
        <meshStandardMaterial color="#ff6b9d" />
      </Box>
      
      {/* Body */}
      <Cylinder args={[0.6, 0.8, 1.5, 32]} position={[0, 0, 0]}>
        <meshStandardMaterial color={color} />
      </Cylinder>
      
      {/* Arms */}
      <Cylinder args={[0.15, 0.15, 1.2, 16]} position={[-0.9, 0.5, 0]} rotation={[0, 0, Math.PI / 6]}>
        <meshStandardMaterial color={color} />
      </Cylinder>
      <Sphere args={[0.2, 16, 16]} position={[-1.3, -0.1, 0]}>
        <meshStandardMaterial color={color} />
      </Sphere>
      
      <Cylinder args={[0.15, 0.15, 1.2, 16]} position={[0.9, 0.5, 0]} rotation={[0, 0, -Math.PI / 6]}>
        <meshStandardMaterial color={color} />
      </Cylinder>
      <Sphere args={[0.2, 16, 16]} position={[1.3, -0.1, 0]}>
        <meshStandardMaterial color={color} />
      </Sphere>
      
      {/* Thinking bubble */}
      {isThinking && (
        <group position={[1.5, 2, 0]}>
          <Sphere args={[0.3, 16, 16]} position={[0, 0, 0]}>
            <meshStandardMaterial color="#ffffff" opacity={0.9} transparent />
          </Sphere>
          <Sphere args={[0.15, 16, 16]} position={[-0.3, -0.4, 0]}>
            <meshStandardMaterial color="#ffffff" opacity={0.9} transparent />
          </Sphere>
          <Sphere args={[0.08, 16, 16]} position={[-0.5, -0.7, 0]}>
            <meshStandardMaterial color="#ffffff" opacity={0.9} transparent />
          </Sphere>
          <Text
            position={[0, 0, 0.31]}
            fontSize={0.2}
            color="#000000"
            anchorX="center"
            anchorY="middle"
          >
            ...
          </Text>
        </group>
      )}
    </group>
  );
}

export default function Character3D({ color, isThinking, isTalking }: Character3DProps) {
  return (
    <Canvas
      camera={{ position: [0, 1.5, 5], fov: 50 }}
      style={{ background: 'transparent' }}
      gl={{ antialias: true, alpha: true }}
      dpr={[1, 2]}
    >
      <Suspense fallback={null}>
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} intensity={1} />
        <pointLight position={[-10, -10, -10]} intensity={0.5} />
        <spotLight position={[0, 5, 5]} angle={0.3} penumbra={1} intensity={1} castShadow />
        
        <CharacterModel color={color} isThinking={isThinking} isTalking={isTalking} />
        
        <OrbitControls 
          enableZoom={false} 
          enablePan={false}
          minPolarAngle={Math.PI / 3}
          maxPolarAngle={Math.PI / 2}
        />
      </Suspense>
    </Canvas>
  );
}

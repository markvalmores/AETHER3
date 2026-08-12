
import React, { useRef, useMemo, useState } from 'react';
import { useFrame, ThreeEvent } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Stars, Float, MeshDistortMaterial } from '@react-three/drei';
import * as THREE from 'three';
import { GameState, Player, WinInfo } from './types';

interface CubeProps {
  position: [number, number, number];
  player: Player;
  isWinning: boolean;
  isGameOver: boolean;
  onClick: (event: ThreeEvent<MouseEvent>) => void;
}

const GameCube: React.FC<CubeProps> = ({ position, player, isWinning, isGameOver, onClick }) => {
  const [hovered, setHovered] = useState(false);
  const meshRef = useRef<THREE.Mesh>(null);
  
  // Subtle animation for empty hovered cells
  useFrame((state) => {
    if (meshRef.current && hovered && !player && !isGameOver) {
      meshRef.current.rotation.y += 0.05;
      meshRef.current.scale.setScalar(THREE.MathUtils.lerp(meshRef.current.scale.x, 1.1, 0.1));
    } else if (meshRef.current) {
      meshRef.current.scale.setScalar(THREE.MathUtils.lerp(meshRef.current.scale.x, 1.0, 0.1));
    }
  });

  return (
    <group position={position}>
      {/* Invisible hit area */}
      <mesh 
        onClick={onClick} 
        onPointerOver={() => setHovered(true)} 
        onPointerOut={() => setHovered(false)} 
        visible={false}
      >
        <boxGeometry args={[0.95, 0.95, 0.95]} />
      </mesh>
      
      {/* Cell Frame */}
      <mesh ref={meshRef}>
        <boxGeometry args={[0.8, 0.8, 0.8]} />
        <meshStandardMaterial 
          color={isWinning ? "#f472b6" : hovered && !player && !isGameOver ? "#38bdf8" : "#475569"} 
          transparent 
          opacity={isWinning ? 0.4 : hovered && !player && !isGameOver ? 0.2 : 0.05} 
          wireframe={!isWinning}
        />
      </mesh>

      {/* Symbol Rendering */}
      {player === 'X' && (
        <Float speed={3} rotationIntensity={2} floatIntensity={1.5}>
           <group rotation={[Math.PI / 4, 0, Math.PI / 4]}>
            <mesh>
              <boxGeometry args={[0.12, 0.65, 0.12]} />
              <meshStandardMaterial color="#0ea5e9" emissive="#0ea5e9" emissiveIntensity={3} />
            </mesh>
            <mesh rotation={[0, 0, Math.PI / 2]}>
              <boxGeometry args={[0.12, 0.65, 0.12]} />
              <meshStandardMaterial color="#0ea5e9" emissive="#0ea5e9" emissiveIntensity={3} />
            </mesh>
          </group>
        </Float>
      )}

      {player === 'O' && (
        <Float speed={3} rotationIntensity={2} floatIntensity={1.5}>
          <mesh>
            <torusGeometry args={[0.28, 0.06, 16, 48]} />
            <meshStandardMaterial color="#ec4899" emissive="#ec4899" emissiveIntensity={3} />
          </mesh>
        </Float>
      )}

      {/* Winning Highlight Aura */}
      {isWinning && (
        <mesh>
          <sphereGeometry args={[0.55, 32, 32]} />
          <MeshDistortMaterial 
            color="#f472b6" 
            speed={5} 
            distort={0.5} 
            radius={1} 
            transparent 
            opacity={0.4} 
          />
        </mesh>
      )}
    </group>
  );
};

interface GameBoard3DProps {
  grid: GameState;
  onCellClick: (x: number, y: number, z: number) => void;
  winInfo: WinInfo | null;
  isDraw: boolean;
}

const GameBoard3D: React.FC<GameBoard3DProps> = ({ grid, onCellClick, winInfo, isDraw }) => {
  const isWinningCell = (x: number, y: number, z: number) => {
    if (!winInfo) return false;
    return winInfo.line.some(([wx, wy, wz]) => wx === x && wy === y && wz === z);
  };

  const isGameOver = !!winInfo || isDraw;

  return (
    <group>
      {grid.map((plane, x) => 
        plane.map((row, y) => 
          row.map((cell, z) => (
            <GameCube
              key={`${x}-${y}-${z}`}
              position={[x - 1, y - 1, z - 1]}
              player={cell}
              isWinning={isWinningCell(x, y, z)}
              isGameOver={isGameOver}
              onClick={(e) => {
                e.stopPropagation();
                onCellClick(x, y, z);
              }}
            />
          ))
        )
      )}
      
      {/* Structural Support Grid */}
      <group>
        <gridHelper args={[3, 3, 0x0ea5e9, 0x1e293b]} position={[0, -0.5, 0]} />
        <gridHelper args={[3, 3, 0x0ea5e9, 0x1e293b]} position={[0, -1.5, 0]} />
        <gridHelper args={[3, 3, 0x0ea5e9, 0x1e293b]} position={[0, 0.5, 0]} />
        <gridHelper args={[3, 3, 0x0ea5e9, 0x1e293b]} position={[0, 1.5, 0]} />
      </group>
    </group>
  );
};

interface SceneProps {
  grid: GameState;
  onCellClick: (x: number, y: number, z: number) => void;
  winInfo: WinInfo | null;
  isDraw: boolean;
  backgroundUrl: string | null;
}

const Scene: React.FC<SceneProps> = ({ grid, onCellClick, winInfo, isDraw, backgroundUrl }) => {
  // Texture loading is no longer needed here as App.tsx handles the global background layer.
  return (
    <>
      <PerspectiveCamera makeDefault position={[6, 4, 6]} fov={45} />
      <OrbitControls autoRotate={!winInfo && !isDraw} autoRotateSpeed={0.5} enablePan={false} minDistance={4} maxDistance={12} />
      
      <ambientLight intensity={1.5} />
      <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} intensity={5} castShadow />
      <pointLight position={[-10, -10, -10]} color="#ec4899" intensity={2} />
      
      <Stars radius={150} depth={50} count={7000} factor={4} saturation={1} fade speed={1.5} />
      
      <GameBoard3D grid={grid} onCellClick={onCellClick} winInfo={winInfo} isDraw={isDraw} />
    </>
  );
};

export default Scene;

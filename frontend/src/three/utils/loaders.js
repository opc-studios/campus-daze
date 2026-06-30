import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'

export const gltfLoader = new GLTFLoader()
export const textureLoader = new THREE.TextureLoader()

export function loadGLTF(url) {
  return new Promise((resolve, reject) => {
    gltfLoader.load(
      url,
      (gltf) => resolve(gltf),
      (progress) => console.log('Loading:', progress),
      (error) => reject(error)
    )
  })
}

export function loadTexture(url) {
  return new Promise((resolve, reject) => {
    textureLoader.load(
      url,
      (texture) => resolve(texture),
      undefined,
      (error) => reject(error)
    )
  })
}

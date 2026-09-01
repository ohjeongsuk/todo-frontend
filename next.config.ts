import path from "node:path";
import { fileURLToPath } from "node:url";

import type { NextConfig } from "next";

// 부모 디렉터리(todo-project)에 npm 파일이 다시 생기면 Next가 워크스페이스 루트를
// 잘못 추론해 조용히 어긋난다. 이 저장소를 파일 트레이싱 루트로 못박아 재발을 막는다.
const projectRoot = path.dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
  outputFileTracingRoot: projectRoot,
};

export default nextConfig;

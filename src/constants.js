import path from 'path';
import os from 'os';

export const HOME_DIR = os.homedir();
export const DOT_DOCUO = path.join(HOME_DIR, '.docuo');
export const TEMPLATE_PATH = path.join(DOT_DOCUO, 'docuo-template');
export const TEMPLATE_GIT_ADDR = 'https://github.com/zhenyuanfu/my-mdx-next.git';
export const CMD_EXEC_PATH = process.cwd();
export const DOCS_PATH = path.join(TEMPLATE_PATH, 'mdxs');
export const TARGET_DOCUO_VERSION = '0.1.2';
export const PACKAGE_JSON_PATH = path.join(TEMPLATE_PATH, 'package.json');

// export const NEXT_PATH = path.join(TEMPLATE_PATH, 'node_modules', 'next');
// export const NEXT_SERVER_PATH = path.join(NEXT_PATH, 'dist', 'server', 'next-server.js');
// export const BASE_CONFIG_PATH = path.join(NEXT_PATH, 'dist', 'server', 'config-shared.js');
// export const NEXT_CONFIG_PATH = path.join(TEMPLATE_PATH, 'next.config.js');
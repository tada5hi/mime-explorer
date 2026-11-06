import { defineConfig } from 'vitest/config';

export default defineConfig({
    "test": {
        "include": [
            "test/unit/**/*.{js,jsx,ts,tsx}",
            "test/**/*.{test,spec}.{js,jsx,ts,tsx}"
        ],
        "exclude": ["**/node_modules/**", "**/dist/**", "test/unit/mock-util.ts"],
        "coverage": {
            "provider": "v8",
            "reportsDirectory": "coverage",
            "include": [
                "src/**/*.{ts,tsx,js,jsx}"
            ],
            "exclude": [
                "src/**/*.d.ts"
            ],
            "thresholds": {
                "branches": 58,
                "functions": 77,
                "lines": 73,
                "statements": 73
            }
        }
    }
});

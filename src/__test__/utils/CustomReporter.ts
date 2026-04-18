import type { Reporter } from "vitest/reporters";

export default class CustomReporter implements Reporter {
    onTestEnd(test: any) {
        console.log(`\n🧪 ${test.name} weeeee`);

        for (const [type, args] of test.logs || []) {
            console.log(`[${type}]`, ...args);
        }
    }

    onCollected() {}
    onInit() {}
    onStart() {}
    onFinished() {}
}
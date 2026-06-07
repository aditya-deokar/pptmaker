import { saveProjectAsTemplate } from "./src/actions/templates";

async function run() {
    const res = await saveProjectAsTemplate("cm25qszf30005z0v889s1h32e", { // Replace with actual project ID
        name: "Test Template",
        description: "Test Template Description 1234",
        category: "BUSINESS",
        tags: ["test", "template"],
        difficulty: "BEGINNER",
        isPublic: false
    });
    console.log(res);
}

run();

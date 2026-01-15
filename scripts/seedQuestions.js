import { Question } from "../config/Question.js";

const questions = [
    // DSA - Easy
    {
        title: "Array Sum",
        description: "What is the time complexity of summing all elements in an array of size n?",
        difficulty: "EASY",
        topic: "DSA",
        type: "MULTIPLE_CHOICE",
        options: [
            { text: "O(1)", isCorrect: false },
            { text: "O(n)", isCorrect: true },
            { text: "O(n^2)", isCorrect: false },
            { text: "O(log n)", isCorrect: false },
        ],
        correctAnswer: "O(n)",
        explanation: "You need to iterate through each element once, resulting in linear time complexity.",
        timeLimit: 45,
        tags: ["complexity", "arrays"],
    },
    {
        title: "Binary Search",
        description: "In a sorted array of 1000 elements, what is the maximum number of comparisons needed for binary search?",
        difficulty: "EASY",
        topic: "DSA",
        type: "MULTIPLE_CHOICE",
        options: [
            { text: "10", isCorrect: true },
            { text: "100", isCorrect: false },
            { text: "1000", isCorrect: false },
            { text: "500", isCorrect: false },
        ],
        correctAnswer: "10",
        explanation: "Binary search has O(log n) complexity. log₂(1000) ≈ 10.",
        timeLimit: 60,
        tags: ["search", "complexity"],
    },

    // DSA - Medium
    {
        title: "Linked List Cycle",
        description: "Which algorithm is used to detect a cycle in a linked list efficiently?",
        difficulty: "MEDIUM",
        topic: "DSA",
        type: "MULTIPLE_CHOICE",
        options: [
            { text: "Two-pointer technique (Floyd's algorithm)", isCorrect: true },
            { text: "Binary search", isCorrect: false },
            { text: "Depth-first search", isCorrect: false },
            { text: "Quick sort", isCorrect: false },
        ],
        correctAnswer: "Two-pointer technique (Floyd's algorithm)",
        explanation: "Floyd's cycle detection uses slow and fast pointers to detect cycles in O(n) time and O(1) space.",
        timeLimit: 60,
        tags: ["linked-list", "two-pointers"],
    },

    // OOPS - Easy
    {
        title: "Inheritance",
        description: "What is the main benefit of inheritance in OOP?",
        difficulty: "EASY",
        topic: "OOPS",
        type: "MULTIPLE_CHOICE",
        options: [
            { text: "Code reusability", isCorrect: true },
            { text: "Faster execution", isCorrect: false },
            { text: "Memory efficiency", isCorrect: false },
            { text: "Type safety", isCorrect: false },
        ],
        correctAnswer: "Code reusability",
        explanation: "Inheritance allows child classes to reuse code from parent classes.",
        timeLimit: 45,
        tags: ["inheritance", "oop-basics"],
    },

    // OOPS - Medium
    {
        title: "Polymorphism",
        description: "Which type of polymorphism is resolved at compile time?",
        difficulty: "MEDIUM",
        topic: "OOPS",
        type: "MULTIPLE_CHOICE",
        options: [
            { text: "Method overloading", isCorrect: true },
            { text: "Method overriding", isCorrect: false },
            { text: "Dynamic binding", isCorrect: false },
            { text: "Late binding", isCorrect: false },
        ],
        correctAnswer: "Method overloading",
        explanation: "Method overloading is compile-time polymorphism, while overriding is runtime.",
        timeLimit: 60,
        tags: ["polymorphism", "compile-time"],
    },

    // OS - Easy
    {
        title: "Process vs Thread",
        description: "What is the main difference between a process and a thread?",
        difficulty: "EASY",
        topic: "OS",
        type: "MULTIPLE_CHOICE",
        options: [
            { text: "Threads share memory, processes don't", isCorrect: true },
            { text: "Processes are faster", isCorrect: false },
            { text: "Threads use more memory", isCorrect: false },
            { text: "Processes can't communicate", isCorrect: false },
        ],
        correctAnswer: "Threads share memory, processes don't",
        explanation: "Threads within the same process share the same memory space.",
        timeLimit: 45,
        tags: ["concurrency", "basics"],
    },

    // OS - Medium
    {
        title: "Deadlock Conditions",
        description: "How many necessary conditions must be present for a deadlock to occur?",
        difficulty: "MEDIUM",
        topic: "OS",
        type: "MULTIPLE_CHOICE",
        options: [
            { text: "4", isCorrect: true },
            { text: "2", isCorrect: false },
            { text: "3", isCorrect: false },
            { text: "5", isCorrect: false },
        ],
        correctAnswer: "4",
        explanation: "The four Coffman conditions: Mutual Exclusion, Hold and Wait, No Preemption, Circular Wait.",
        timeLimit: 60,
        tags: ["deadlock", "synchronization"],
    },

    // DBMS - Easy
    {
        title: "Primary Key",
        description: "What is the purpose of a primary key in a database table?",
        difficulty: "EASY",
        topic: "DBMS",
        type: "MULTIPLE_CHOICE",
        options: [
            { text: "Uniquely identify each row", isCorrect: true },
            { text: "Speed up queries", isCorrect: false },
            { text: "Store foreign keys", isCorrect: false },
            { text: "Enable sorting", isCorrect: false },
        ],
        correctAnswer: "Uniquely identify each row",
        explanation: "A primary key uniquely identifies each record in a table.",
        timeLimit: 45,
        tags: ["keys", "basics"],
    },

    // DBMS - Medium
    {
        title: "Normalization",
        description: "Which normal form eliminates partial dependencies?",
        difficulty: "MEDIUM",
        topic: "DBMS",
        type: "MULTIPLE_CHOICE",
        options: [
            { text: "Second Normal Form (2NF)", isCorrect: true },
            { text: "First Normal Form (1NF)", isCorrect: false },
            { text: "Third Normal Form (3NF)", isCorrect: false },
            { text: "BCNF", isCorrect: false },
        ],
        correctAnswer: "Second Normal Form (2NF)",
        explanation: "2NF removes partial dependencies on composite primary keys.",
        timeLimit: 60,
        tags: ["normalization", "design"],
    },

    // CN - Easy
    {
        title: "OSI Model",
        description: "How many layers are in the OSI model?",
        difficulty: "EASY",
        topic: "CN",
        type: "MULTIPLE_CHOICE",
        options: [
            { text: "7", isCorrect: true },
            { text: "5", isCorrect: false },
            { text: "4", isCorrect: false },
            { text: "6", isCorrect: false },
        ],
        correctAnswer: "7",
        explanation: "The OSI model has 7 layers: Physical, Data Link, Network, Transport, Session, Presentation, Application.",
        timeLimit: 45,
        tags: ["osi", "basics"],
    },

    // CN - Medium
    {
        title: "TCP vs UDP",
        description: "Which protocol provides reliable, ordered delivery of data?",
        difficulty: "MEDIUM",
        topic: "CN",
        type: "MULTIPLE_CHOICE",
        options: [
            { text: "TCP", isCorrect: true },
            { text: "UDP", isCorrect: false },
            { text: "HTTP", isCorrect: false },
            { text: "FTP", isCorrect: false },
        ],
        correctAnswer: "TCP",
        explanation: "TCP (Transmission Control Protocol) ensures reliable, ordered delivery with error checking and retransmission.",
        timeLimit: 60,
        tags: ["protocols", "transport"],
    },
];

async function seedQuestions() {
    try {
        // Clear existing questions
        await Question.deleteMany({});
        console.log("Cleared existing questions");

        // Insert new questions
        const inserted = await Question.insertMany(questions);
        console.log(`Seeded ${inserted.length} questions successfully`);

        // Print summary
        const summary = {};
        inserted.forEach((q) => {
            const key = `${q.topic}-${q.difficulty}`;
            summary[key] = (summary[key] || 0) + 1;
        });
        console.log("Summary:", summary);

        return inserted;
    } catch (error) {
        console.error("Error seeding questions:", error);
        throw error;
    }
}

export default seedQuestions;

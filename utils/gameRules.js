export const TIME_LIMITS = {
    EASY: 15,
    MEDIUM: 20,
    HARD: 25,
    DEFAULT: 30
};

export const getQuestionTimeLimit = (difficulty) => {
    if (!difficulty) return TIME_LIMITS.DEFAULT;
    return TIME_LIMITS[difficulty.toUpperCase()] || TIME_LIMITS.DEFAULT;
};

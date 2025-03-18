import React, {useEffect, useRef, useState} from 'react';
import {
    ActivityIndicator,
    Animated,
    Dimensions,
    Image,
    LayoutAnimation,
    Platform,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    UIManager
} from 'react-native';
import {Text, View} from '@/components/Themed';
import {FontAwesome} from '@expo/vector-icons';
import {LinearGradient} from 'expo-linear-gradient';
import {getQuestions} from '@/services/question.service';
import {Question} from '@/types/question/question';
import {SKIN_TYPES_INFO} from '@/assets/data/skin-type-info';
import {getRecommendProducts, getSkincarePlan} from '@/services/skincare-plan.service';
import {Product} from '@/types/product/product';
import ProductCard from '@/components/product/ProductCard';
import {Stack} from 'expo-router';
import {SkinType} from "@/types/skincare-plan/skincare-plan";

// Enable LayoutAnimation on Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
}

const {width} = Dimensions.get('window');

type QuizAnswer = {
    questionId: string;
    optionId: string;
};

// For demo only - in a real app this would come from authentication
// const MOCK_USER_ID = '658a19a5fb51d86df22f2625';

export default function SkinQuizScreen() {
    const [questions, setQuestions] = useState<Question[]>([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [currentQuestion, setCurrentQuestion] = useState(0);
    const [answers, setAnswers] = useState<QuizAnswer[]>([]);
    const [showWelcome, setShowWelcome] = useState(true);
    const [quizCompleted, setQuizCompleted] = useState(false);
    const [skinTypeResult, setSkinTypeResult] = useState<string | null>(null);
    const [skincarePlan, setSkincarePlan] = useState<any>(null);
    const [recommendedProducts, setRecommendedProducts] = useState<Product[]>([]);
    const [loadingResults, setLoadingResults] = useState(false);

    // Animation values
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(30)).current;

    useEffect(() => {
        loadQuestions();

        // // Check if user already has skin type result
        // const checkExistingResult = async () => {
        //     try {
        //         const result = await getSkinTestResult(MOCK_USER_ID);
        //         if (result && result.skinType) {
        //             setSkinTypeResult(result.skinType);
        //             setQuizCompleted(true);
        //             setShowWelcome(false);
        //             loadSkinTypeData(result.skinType as SkinType);
        //         }
        //     } catch (error) {
        //         console.error('Error checking existing skin test result:', error);
        //     }
        // };
        //
        // checkExistingResult();
    }, []);

    useEffect(() => {
        // Run animations when content changes
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 500,
                useNativeDriver: true
            }),
            Animated.timing(slideAnim, {
                toValue: 0,
                duration: 500,
                useNativeDriver: true
            })
        ]).start();

        return () => {
            fadeAnim.setValue(0);
            slideAnim.setValue(30);
        };
    }, [currentQuestion, quizCompleted, showWelcome]);

    const loadQuestions = async () => {
        try {
            setLoading(true);
            const fetchedQuestions = await getQuestions();
            setQuestions(fetchedQuestions);
        } catch (error) {
            console.error('Error loading questions:', error);
        } finally {
            setLoading(false);
        }
    };

    const loadSkinTypeData = async (skinType: SkinType) => {
        setLoadingResults(true);
        try {
            // Fetch skincare plan and recommended products in parallel
            const [planData, productsData] = await Promise.all([
                getSkincarePlan(skinType),
                getRecommendProducts(skinType)
            ]);

            setSkincarePlan(planData);
            setRecommendedProducts(productsData);
        } catch (error) {
            console.error('Error loading skincare data:', error);
        } finally {
            setLoadingResults(false);
        }
    };

    const startQuiz = () => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setShowWelcome(false);
        loadQuestions();
        setCurrentQuestion(0);
        setAnswers([]);
        setQuizCompleted(false);
        setSkinTypeResult(null);
    };

    const handleAnswer = (questionId: string, optionId: string) => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);

        const existingAnswerIndex = answers.findIndex(a => a.questionId === questionId);

        if (existingAnswerIndex !== -1) {
            const newAnswers = [...answers];
            newAnswers[existingAnswerIndex] = {questionId, optionId};
            setAnswers(newAnswers);
        } else {
            setAnswers([...answers, {questionId, optionId}]);
        }

        // After a short delay, move to next question or complete quiz
        setTimeout(() => {
            if (currentQuestion < questions.length - 1) {
                setCurrentQuestion(currentQuestion + 1);
            } else {
                completeQuiz();
            }
        }, 500);
    };

    const handlePrevious = () => {
        if (currentQuestion > 0) {
            LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
            setCurrentQuestion(currentQuestion - 1);
        }
    };

    const completeQuiz = async () => {
        setSubmitting(true);
        try {
            const totalPoints = calculatePoints();
            let skinType: SkinType;

            if (totalPoints >= 20) {
                skinType = 'OILY';
            } else if (totalPoints >= 15) {
                skinType = 'COMBINATION';
            } else if (totalPoints >= 10) {
                skinType = 'NORMAL';
            } else {
                skinType = 'DRY';
            }

            // In a real app, submit answers to the backend
            // await submitQuizResults(answers.map(a => ({questionId: a.questionId, optionId: a.optionId})));
            // const result = await getSkinTestResult(MOCK_USER_ID);
            // setSkinTypeResult(result.skinType);

            // For demo, just use calculated result
            setSkinTypeResult(skinType);
            loadSkinTypeData(skinType);

            // Mark quiz as completed
            setQuizCompleted(true);

        } catch (error) {
            console.error('Error submitting quiz results:', error);
        } finally {
            setSubmitting(false);
        }
    };

    const calculatePoints = (): number => {
        let totalPoints = 0;

        answers.forEach(answer => {
            const question = questions.find(q => q._id === answer.questionId);
            if (question) {
                const option = question.options.find(o => o._id === answer.optionId);
                if (option) {
                    totalPoints += option.point;
                }
            }
        });

        return totalPoints;
    };

    const restartQuiz = () => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setShowWelcome(true);
        setCurrentQuestion(0);
        setAnswers([]);
        setQuizCompleted(false);
        setSkinTypeResult(null);
    };

    // Welcome Screen
    if (showWelcome) {
        return (
            <Animated.View
                style={[
                    styles.container,
                    {opacity: fadeAnim, transform: [{translateY: slideAnim}]}
                ]}
            >
                <Stack.Screen options={{title: 'Skin Quiz', headerTitleAlign: 'center'}}/>
                <ScrollView
                    contentContainerStyle={styles.welcomeContainer}
                    showsVerticalScrollIndicator={false}
                >
                    <Image
                        source={{uri: 'https://i.pinimg.com/736x/c3/7f/41/c37f41dede903a15de8b0c9b9f4e3ead.jpg'}}
                        style={styles.welcomeImage}
                    />

                    <View style={styles.welcomeContent}>
                        <Text style={styles.welcomeTitle}>Khám phá loại da của bạn</Text>
                        <Text style={styles.welcomeText}>
                            Trả lời một vài câu hỏi đơn giản để xác định chính xác loại da của bạn và
                            nhận được lời khuyên chăm sóc da cá nhân hóa.
                        </Text>

                        <View style={styles.featureList}>
                            <View style={styles.featureItem}>
                                <View style={styles.featureIcon}>
                                    <FontAwesome name="check-circle" size={20} color="#2f95dc"/>
                                </View>
                                <Text style={styles.featureText}>Phân tích chuyên sâu về làn da</Text>
                            </View>

                            <View style={styles.featureItem}>
                                <View style={styles.featureIcon}>
                                    <FontAwesome name="list-alt" size={20} color="#2f95dc"/>
                                </View>
                                <Text style={styles.featureText}>Quy trình chăm sóc da cá nhân hóa</Text>
                            </View>

                            <View style={styles.featureItem}>
                                <View style={styles.featureIcon}>
                                    <FontAwesome name="shopping-bag" size={20} color="#2f95dc"/>
                                </View>
                                <Text style={styles.featureText}>Sản phẩm được đề xuất theo loại da</Text>
                            </View>
                        </View>

                        <TouchableOpacity
                            style={styles.startButton}
                            onPress={startQuiz}
                        >
                            <Text style={styles.startButtonText}>Bắt đầu kiểm tra</Text>
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            </Animated.View>
        );
    }

    // Loading state
    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <Stack.Screen options={{title: 'Loading...', headerTitleAlign: 'center'}}/>
                <ActivityIndicator size="large" color="#2f95dc"/>
                <Text style={styles.loadingText}>Đang tải câu hỏi...</Text>
            </View>
        );
    }

    // Quiz Results Screen
    if (quizCompleted && skinTypeResult) {
        const skinTypeInfo = SKIN_TYPES_INFO[skinTypeResult as keyof typeof SKIN_TYPES_INFO];

        return (
            <Animated.View
                style={[
                    styles.container,
                    {opacity: fadeAnim, transform: [{translateY: slideAnim}]}
                ]}
            >
                <Stack.Screen
                    options={{
                        title: 'Kết quả',
                        headerTitleAlign: 'center',
                        headerTitleStyle: {color: '#fff'},
                        headerStyle: {
                            backgroundColor: skinTypeInfo.colors[0],
                        },
                        headerTintColor: '#fff'
                    }}
                />

                <ScrollView
                    contentContainerStyle={styles.resultContainer}
                    showsVerticalScrollIndicator={false}
                >
                    {/* Skin Type Header */}
                    <LinearGradient
                        colors={skinTypeInfo.colors as [string, string, ...string[]]}
                        start={{x: 0, y: 0}}
                        end={{x: 1, y: 1}}
                        style={styles.resultHeader}
                    >
                        <Text style={styles.resultHeaderTitle}>Loại da của bạn</Text>
                        <Text style={styles.skinTypeTitle}>{skinTypeInfo.title}</Text>
                        <Text style={styles.resultHeaderText}>{skinTypeInfo.description}</Text>
                    </LinearGradient>

                    <Image
                        source={{uri: skinTypeInfo.image}}
                        style={styles.skinTypeImage}
                        resizeMode="cover"
                    />

                    <View style={styles.resultContent}>
                        {/* Characteristics Section */}
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>Đặc điểm da của bạn</Text>
                            {skinTypeInfo.characteristics.map((characteristic, index) => (
                                <View key={`char-${index}`} style={styles.characteristicItem}>
                                    <View style={styles.bulletPoint}>
                                        <FontAwesome name="circle" size={8} color={skinTypeInfo.colors[0]}/>
                                    </View>
                                    <Text style={styles.characteristicText}>{characteristic}</Text>
                                </View>
                            ))}
                        </View>

                        {/* Tips Section */}
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>Lời khuyên</Text>
                            {skinTypeInfo.tips.map((tip, index) => (
                                <View key={`tip-${index}`} style={styles.tipItem}>
                                    <View style={[styles.tipNumber, {backgroundColor: skinTypeInfo.colors[0]}]}>
                                        <Text style={styles.tipNumberText}>{index + 1}</Text>
                                    </View>
                                    <Text style={styles.tipText}>{tip}</Text>
                                </View>
                            ))}
                        </View>

                        {/* Skincare Routine Section */}
                        {loadingResults ? (
                            <View style={styles.loadingRoutineContainer}>
                                <ActivityIndicator size="small" color="#2f95dc"/>
                                <Text style={styles.loadingText}>Đang tải quy trình...</Text>
                            </View>
                        ) : skincarePlan ? (
                            <View style={styles.section}>
                                <Text style={styles.sectionTitle}>Quy trình chăm sóc da</Text>
                                <Text style={styles.routineDescription}>{skincarePlan.description}</Text>

                                {skincarePlan.steps.map((step: any, index: number) => (
                                    <View key={`step-${index}`} style={styles.routineStep}>
                                        <View
                                            style={[styles.routineStepIcon, {backgroundColor: skinTypeInfo.colors[0]}]}>
                                            <Text style={styles.routineStepNumber}>{index + 1}</Text>
                                        </View>
                                        <View style={styles.routineStepContent}>
                                            <Text style={styles.routineStepTitle}>
                                                {step.step.charAt(0).toUpperCase() + step.step.slice(1)}
                                            </Text>
                                            <Text style={styles.routineStepDescription}>{step.description}</Text>
                                            <Text style={styles.routineStepFrequency}>
                                                <Text style={styles.frequencyLabel}>Tần suất: </Text>
                                                {step.frequency}
                                            </Text>
                                        </View>
                                    </View>
                                ))}
                            </View>
                        ) : (
                            <View style={styles.noRoutineContainer}>
                                <Text style={styles.noRoutineText}>Không thể tải quy trình chăm sóc da</Text>
                            </View>
                        )}

                        {/* Recommended Products Section */}
                        {recommendedProducts.length > 0 && (
                            <View style={styles.section}>
                                <Text style={styles.sectionTitle}>Sản phẩm đề xuất</Text>
                                <Text style={styles.recommendationIntro}>
                                    Dựa vào kết quả phân tích làn da, đây là một số sản phẩm phù hợp với bạn:
                                </Text>

                                <View style={styles.productsContainer}>
                                    {recommendedProducts.map((product, index) => (
                                        <View key={`product-${index}`} style={styles.productCardContainer}>
                                            <ProductCard product={product}/>
                                        </View>
                                    ))}
                                </View>
                            </View>
                        )}

                        {/* Restart Button */}
                        <TouchableOpacity
                            style={[styles.restartButton, {backgroundColor: skinTypeInfo.colors[0]}]}
                            onPress={restartQuiz}
                        >
                            <Text style={styles.restartButtonText}>Làm lại bài kiểm tra</Text>
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            </Animated.View>
        );
    }

    // Quiz Questions Screen
    const question = questions[currentQuestion];

    return (
        <View style={styles.container}>
            <Stack.Screen options={{title: 'Skin Quiz', headerTitleAlign: 'center'}}/>

            {/* Progress Bar */}
            <View style={styles.progressContainer}>
                <View style={styles.progressBarBackground}>
                    <View
                        style={[
                            styles.progressBar,
                            {width: `${((currentQuestion + 1) / questions.length) * 100}%`}
                        ]}
                    />
                </View>
                <Text style={styles.progressText}>{currentQuestion + 1}/{questions.length}</Text>
            </View>

            <Animated.View
                style={[
                    styles.questionContainer,
                    {opacity: fadeAnim, transform: [{translateY: slideAnim}]}
                ]}
            >
                <Text style={styles.questionText}>{question.question}</Text>

                <View style={styles.optionsContainer}>
                    {question.options.map((option) => {
                        const isSelected = answers.some(
                            a => a.questionId === question._id && a.optionId === option._id
                        );

                        return (
                            <TouchableOpacity
                                key={option._id}
                                style={[
                                    styles.optionButton,
                                    isSelected && styles.selectedOption
                                ]}
                                onPress={() => handleAnswer(question._id, option._id)}
                                disabled={submitting}
                            >
                                <Text
                                    style={[
                                        styles.optionText,
                                        isSelected && styles.selectedOptionText
                                    ]}
                                >
                                    {option.option}
                                </Text>

                                {isSelected && (
                                    <View style={styles.checkmark}>
                                        <FontAwesome name="check" size={16} color="#fff"/>
                                    </View>
                                )}
                            </TouchableOpacity>
                        );
                    })}
                </View>

                <View style={styles.navigationRow}>
                    {currentQuestion > 0 && (
                        <TouchableOpacity
                            style={styles.prevButton}
                            onPress={handlePrevious}
                            disabled={submitting}
                        >
                            <FontAwesome name="angle-left" size={20} color="#666" />
                            <Text style={styles.prevButtonText}>Previous</Text>
                        </TouchableOpacity>
                    )}
                    <Text style={styles.progressText}>{currentQuestion + 1}/{questions.length}</Text>
                </View>

                {submitting && (
                    <View style={styles.submittingContainer}>
                        <ActivityIndicator size="large" color="#2f95dc"/>
                        <Text style={styles.submittingText}>Đang phân tích kết quả...</Text>
                    </View>
                )}
            </Animated.View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8f8f8',
    },
    // Welcome Screen Styles
    welcomeContainer: {
        flexGrow: 1,
    },
    welcomeImage: {
        width: '100%',
        height: 250,
        borderBottomLeftRadius: 30,
        borderBottomRightRadius: 30,
    },
    welcomeContent: {
        padding: 24,
        backgroundColor: 'transparent',
    },
    welcomeTitle: {
        fontSize: 28,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 16,
        color: '#333',
    },
    welcomeText: {
        fontSize: 16,
        color: '#555',
        textAlign: 'center',
        lineHeight: 24,
        marginBottom: 30,
    },
    featureList: {
        marginBottom: 30,
        backgroundColor: 'transparent',
    },
    featureItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
        backgroundColor: 'transparent',
    },
    featureIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(47,149,220,0.1)',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 16,
    },
    featureText: {
        fontSize: 16,
        color: '#444',
    },
    startButton: {
        backgroundColor: '#2f95dc',
        paddingVertical: 16,
        borderRadius: 28,
        alignItems: 'center',
    },
    startButtonText: {
        color: 'white',
        fontSize: 18,
        fontWeight: '600',
    },
    // Loading Styles
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 16,
        fontSize: 16,
        color: '#666',
    },
    // Quiz Questions Styles
    progressContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: 16,
        paddingBottom: 8,
    },
    progressBarBackground: {
        flex: 1,
        height: 8,
        backgroundColor: '#e0e0e0',
        borderRadius: 4,
        marginRight: 12,
    },
    progressBar: {
        height: 8,
        backgroundColor: '#2f95dc',
        borderRadius: 4,
    },
    progressText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#666',
    },
    questionContainer: {
        flex: 1,
        padding: 24,
    },
    questionText: {
        fontSize: 22,
        fontWeight: '700',
        color: '#333',
        marginBottom: 30,
        lineHeight: 32,
    },
    optionsContainer: {
        flex: 1,
    },
    optionButton: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: 'white',
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#e5e5e5',
        shadowColor: '#000',
        shadowOffset: {width: 0, height: 1},
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 2,
    },
    selectedOption: {
        backgroundColor: '#2f95dc',
        borderColor: '#2f95dc',
    },
    optionText: {
        fontSize: 16,
        color: '#444',
        flex: 1,
    },
    selectedOptionText: {
        color: 'white',
        fontWeight: '500',
    },
    checkmark: {
        backgroundColor: 'transparent',
    },
    navigationRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingTop: 16,
        paddingBottom: 8,
        backgroundColor: 'transparent',
    },
    prevButton: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 8,
        borderRadius: 8,
        backgroundColor: '#f0f0f0',
    },
    prevButtonText: {
        fontSize: 14,
        fontWeight: '500',
        color: '#666',
        marginLeft: 5,
    },
    submittingContainer: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.9)',
    },
    submittingText: {
        marginTop: 16,
        fontSize: 18,
        color: '#555',
    },
    // Results Screen Styles
    resultContainer: {
        flexGrow: 1,
    },
    resultHeader: {
        padding: 30,
        alignItems: 'center',
    },
    resultHeaderTitle: {
        fontSize: 16,
        color: 'white',
        opacity: 0.9,
        marginBottom: 8,
    },
    skinTypeTitle: {
        fontSize: 32,
        fontWeight: 'bold',
        color: 'white',
        marginBottom: 12,
    },
    resultHeaderText: {
        fontSize: 14,
        color: 'white',
        textAlign: 'center',
        lineHeight: 22,
    },
    skinTypeImage: {
        width: '100%',
        height: 200,
    },
    resultContent: {
        padding: 20,
        backgroundColor: 'transparent',
    },
    section: {
        marginBottom: 30,
        backgroundColor: 'transparent',
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 16,
    },
    characteristicItem: {
        flexDirection: 'row',
        marginBottom: 12,
        backgroundColor: 'transparent',
    },
    bulletPoint: {
        width: 20,
        alignItems: 'center',
        paddingTop: 8,
        backgroundColor: 'transparent',
    },
    characteristicText: {
        flex: 1,
        fontSize: 16,
        lineHeight: 24,
        color: '#444',
    },
    tipItem: {
        flexDirection: 'row',
        marginBottom: 16,
        backgroundColor: 'transparent',
    },
    tipNumber: {
        width: 28,
        height: 28,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
        marginTop: 2,
    },
    tipNumberText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 14,
    },
    tipText: {
        flex: 1,
        fontSize: 16,
        lineHeight: 24,
        color: '#444',
    },
    loadingRoutineContainer: {
        padding: 40,
        alignItems: 'center',
    },
    noRoutineContainer: {
        padding: 20,
        alignItems: 'center',
    },
    noRoutineText: {
        fontSize: 16,
        color: '#666',
    },
    routineDescription: {
        fontSize: 16,
        lineHeight: 24,
        color: '#444',
        marginBottom: 20,
    },
    routineStep: {
        flexDirection: 'row',
        marginBottom: 20,
        paddingBottom: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
        backgroundColor: 'transparent',
    },
    routineStepIcon: {
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
        marginTop: 2,
    },
    routineStepNumber: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 16,
    },
    routineStepContent: {
        flex: 1,
        backgroundColor: 'transparent',
    },
    routineStepTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#333',
        marginBottom: 6,
    },
    routineStepDescription: {
        fontSize: 16,
        lineHeight: 22,
        color: '#444',
        marginBottom: 8,
    },
    routineStepFrequency: {
        fontSize: 14,
        color: '#666',
    },
    frequencyLabel: {
        fontWeight: '600',
    },
    recommendationIntro: {
        fontSize: 16,
        lineHeight: 24,
        color: '#444',
        marginBottom: 20,
    },
    productsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        backgroundColor: 'transparent',
    },
    productCardContainer: {
        width: '48%',
        marginBottom: 16,
        backgroundColor: 'transparent',
    },
    restartButton: {
        paddingVertical: 16,
        borderRadius: 28,
        alignItems: 'center',
        marginTop: 10,
        marginBottom: 30,
    },
    restartButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '600',
    },
});
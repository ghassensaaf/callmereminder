"use client";

import { forwardRef, useState, useEffect, useMemo } from "react";
import { PhoneInput as ReactPhoneInput } from "react-international-phone";
import "react-international-phone/style.css";
import { isValidPhoneNumber, parsePhoneNumberWithError } from "libphonenumber-js";
import { cn } from "@/lib/utils";
import { Check, Phone } from "lucide-react";
import { motion } from "framer-motion";

export interface PhoneInputProps {
    value?: string;
    onChange?: (e164: string, isValid: boolean) => void;
    onBlur?: () => void;
    label?: string;
    error?: string;
    hint?: string;
    placeholder?: string;
    disabled?: boolean;
    name?: string;
    defaultCountry?: string;
}

// Detect default country from browser locale
function detectDefaultCountry(): string {
    if (typeof navigator === "undefined") return "us";

    const language = navigator.language || "en-US";
    const region = language.split("-")[1]?.toLowerCase();

    // Common mappings
    const regionMap: Record<string, string> = {
        us: "us", gb: "gb", uk: "gb", ca: "ca", au: "au",
        de: "de", fr: "fr", it: "it", es: "es", nl: "nl",
        be: "be", ch: "ch", at: "at", se: "se", no: "no",
        dk: "dk", fi: "fi", pl: "pl", pt: "pt", ie: "ie",
        gr: "gr", tn: "tn", ma: "ma", eg: "eg", za: "za",
        jp: "jp", cn: "cn", kr: "kr", in: "in", sg: "sg",
        hk: "hk", tw: "tw", ae: "ae", sa: "sa", il: "il",
        tr: "tr", ru: "ru", br: "br", mx: "mx", ar: "ar",
    };

    return regionMap[region] || "us";
}

// Validate phone number using libphonenumber-js
export function validatePhoneNumber(phone: string): { isValid: boolean; country?: string; formatted?: string } {
    if (!phone || phone.length < 4) {
        return { isValid: false };
    }

    try {
        const valid = isValidPhoneNumber(phone);
        if (valid) {
            const parsed = parsePhoneNumberWithError(phone);
            return {
                isValid: true,
                country: parsed?.country,
                formatted: parsed?.formatInternational(),
            };
        }
        return { isValid: false };
    } catch {
        return { isValid: false };
    }
}

const PhoneInput = forwardRef<HTMLInputElement, PhoneInputProps>(
    ({ value, onChange, onBlur, label, error, hint, placeholder, disabled, name, defaultCountry }, ref) => {
        const [phone, setPhone] = useState(value || "");
        const [isFocused, setIsFocused] = useState(false);
        const [detectedCountry] = useState(() => defaultCountry || detectDefaultCountry());

        // Validate using libphonenumber-js
        const validation = useMemo(() => validatePhoneNumber(phone), [phone]);
        const hasValue = phone.length > 1;

        // Sync external value changes
        useEffect(() => {
            if (value !== undefined && value !== phone) {
                setPhone(value);
            }
        }, [value]);

        const handleChange = (newPhone: string) => {
            setPhone(newPhone);
            const newValidation = validatePhoneNumber(newPhone);
            onChange?.(newPhone, newValidation.isValid);
        };

        return (
            <div className="w-full">
                {label && (
                    <label className="block text-sm font-medium text-surface-700 mb-1.5">
                        {label}
                    </label>
                )}

                <div
                    className={cn(
                        "phone-input-container relative rounded-xl border bg-white transition-all duration-200",
                        error
                            ? "border-danger-500 focus-within:ring-2 focus-within:ring-danger-500/30"
                            : isFocused
                                ? "border-primary-500 ring-2 ring-primary-500/30"
                                : "border-surface-200 hover:border-surface-300",
                        disabled && "bg-surface-50 cursor-not-allowed opacity-60"
                    )}
                >
                    <ReactPhoneInput
                        ref={ref as any}
                        value={phone}
                        onChange={handleChange}
                        defaultCountry={detectedCountry}
                        disabled={disabled}
                        placeholder={placeholder || "Phone number"}
                        inputProps={{
                            name,
                            onFocus: () => setIsFocused(true),
                            onBlur: () => {
                                setIsFocused(false);
                                onBlur?.();
                            },
                        }}
                        countrySelectorStyleProps={{
                            buttonClassName: cn(
                                "!h-full !px-3 !border-0 !border-r !border-surface-200 !rounded-none",
                                "!bg-surface-50/50 hover:!bg-surface-100 !transition-colors",
                                disabled && "!cursor-not-allowed hover:!bg-surface-50/50"
                            ),
                            dropdownStyleProps: {
                                className: cn(
                                    "!rounded-xl !border !border-surface-200 !bg-white",
                                    "!shadow-xl !shadow-surface-900/10 !mt-2 !z-[9999]"
                                ),
                                listItemClassName: cn(
                                    "!px-3 !py-2.5 hover:!bg-surface-50 !transition-colors"
                                ),
                            },
                        }}
                        inputClassName={cn(
                            "!border-0 !rounded-none !h-auto !py-2.5 !px-4",
                            "!text-sm !text-surface-900 !bg-transparent",
                            "!outline-none focus:!outline-none focus:!ring-0",
                            "placeholder:!text-surface-400"
                        )}
                        style={{
                            "--react-international-phone-height": "auto",
                            "--react-international-phone-border-radius": "0",
                            "--react-international-phone-border-color": "transparent",
                            "--react-international-phone-background-color": "transparent",
                            "--react-international-phone-font-size": "0.875rem",
                            "--react-international-phone-dropdown-item-background-color": "transparent",
                        } as React.CSSProperties}
                    />

                    {/* Validation indicator */}
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2 pointer-events-none">
                        {hasValue && (
                            <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                className={cn(
                                    "flex items-center justify-center w-6 h-6 rounded-full",
                                    validation.isValid
                                        ? "bg-success-100 text-success-600"
                                        : "bg-surface-100 text-surface-400"
                                )}
                            >
                                {validation.isValid ? (
                                    <Check className="h-3.5 w-3.5" />
                                ) : (
                                    <Phone className="h-3.5 w-3.5" />
                                )}
                            </motion.div>
                        )}
                    </div>
                </div>

                {/* Error / Hint */}
                {(error || hint) && (
                    <p
                        className={cn(
                            "mt-1.5 text-xs",
                            error ? "text-danger-500" : "text-surface-500"
                        )}
                    >
                        {error || hint}
                    </p>
                )}
            </div>
        );
    }
);

PhoneInput.displayName = "PhoneInput";

export { PhoneInput };

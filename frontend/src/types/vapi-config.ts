export interface VapiPhoneNumberDto {
  id: string;
  vapi_phone_number_id: string;
  nickname: string;
  is_default: boolean;
}

export interface VapiConfigDto {
  id: string;
  name: string;
  api_key_masked: string | null;
  is_default: boolean;
  numbers: VapiPhoneNumberDto[];
}

export interface VapiConfigListResponse {
  configs: VapiConfigDto[];
  default_line_id: string | null;
}

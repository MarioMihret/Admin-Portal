"use client";

import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ISubscriptionPlanFE } from '../page'; // Assuming types are exported from plans page or a shared types file
import { Trash2, PlusCircle, DollarSign, RefreshCw, Info, ChevronDown } from 'lucide-react'; // Added ChevronDown for select indicator
import { toast } from 'sonner';

// Zod schema for frontend form validation (should align with backend schema)
const featureFormSchema = z.object({
  name: z.string().min(1, 'Feature name is required'),
  enabled: z.boolean().optional().default(true),
  limit: z.coerce.number().optional(), // coerce to number for input type="number"
});

const usageLimitsFormSchema = z.object({
  users: z.coerce.number().optional(),
  projects: z.coerce.number().optional(),
  storageGB: z.coerce.number().optional(),
}).optional();

export const planFormSchema = z.object({
  name: z.string().min(1, 'Plan name is required'),
  slug: z.string()
    .min(1, 'Slug is required')
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug must be lowercase alphanumeric with hyphens (e.g., basic-plan)')
    .toLowerCase(),
  description: z.string().optional(),
  price: z.coerce.number().min(0, 'Price cannot be negative'),
  currency: z.string().min(3, 'Currency code (e.g., USD)').max(3).toUpperCase(),
  billingCycle: z.enum(['monthly', 'annually', 'one-time']),
  features: z.array(featureFormSchema).optional().default([]),
  usageLimits: usageLimitsFormSchema,
  isActive: z.boolean().optional().default(true),
  isMostPopular: z.boolean().optional().default(false),
});

export type PlanFormValues = z.infer<typeof planFormSchema>;

interface PlanFormProps {
  onSubmit: (values: PlanFormValues) => Promise<void>;
  initialData?: Partial<ISubscriptionPlanFE>; // For editing
  isLoading?: boolean;
  submitButtonText?: string;
  onCancel?: () => void; // Optional cancel handler
}

// Basic Tailwind styled components (can be extracted to a separate file if used more widely)
const StyledInput = "w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500 sm:text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200 disabled:opacity-50";
const StyledTextarea = `${StyledInput} min-h-[80px]`
const StyledSelect = `${StyledInput} appearance-none`; // appearance-none to hide default arrow
const StyledCheckboxLabel = "flex items-center space-x-2 text-sm font-medium text-gray-700 dark:text-gray-300 cursor-pointer";
const StyledCheckbox = "h-4 w-4 text-purple-600 border-gray-300 dark:border-gray-600 rounded focus:ring-purple-500 disabled:opacity-50";
const StyledButton = "inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-gray-800 disabled:opacity-50 transition-colors";
const PrimaryButton = `${StyledButton} text-white bg-purple-600 hover:bg-purple-700 focus:ring-purple-500`;
const OutlineButton = `${StyledButton} text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600 focus:ring-purple-500`;
const GhostButton = `${StyledButton} border-transparent hover:bg-gray-100 dark:hover:bg-gray-700`;

const CardShell: React.FC<{children: React.ReactNode, className?: string}> = ({ children, className }) => (
    <div className={`bg-white dark:bg-gray-800 shadow-lg rounded-xl ${className}`}>{children}</div>
);
const CardHeaderShell: React.FC<{title: string, description?: string}> = ({ title, description }) => (
    <div className="px-6 py-5 border-b border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold leading-6 text-gray-900 dark:text-white">{title}</h3>
        {description && <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{description}</p>}
    </div>
);
const CardContentShell: React.FC<{children: React.ReactNode, className?: string}> = ({ children, className }) => (
    <div className={`p-6 ${className}`}>{children}</div>
);
const CardFooterShell: React.FC<{children: React.ReactNode, className?: string}> = ({ children, className }) => (
    <div className={`px-6 py-4 bg-gray-50 dark:bg-gray-700/50 border-t border-gray-200 dark:border-gray-700 ${className}`}>{children}</div>
);
const FormLabel: React.FC<{htmlFor: string, children: React.ReactNode, className?: string}> = ({htmlFor, children, className}) => (
    <label htmlFor={htmlFor} className={`block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 ${className}`}>{children}</label>
);

export default function PlanForm({ 
  onSubmit, 
  initialData, 
  isLoading = false, 
  submitButtonText = 'Submit',
  onCancel
}: PlanFormProps) {
  const { register, handleSubmit, control, formState: { errors }, watch, setValue } = useForm<PlanFormValues>({
    resolver: zodResolver(planFormSchema),
    defaultValues: {
      name: initialData?.name || '',
      slug: initialData?.slug || '',
      description: initialData?.description || '',
      price: initialData?.price || 0,
      currency: initialData?.currency || 'USD',
      billingCycle: initialData?.billingCycle || 'monthly',
      features: initialData?.features || [],
      usageLimits: initialData?.usageLimits || { users: undefined, projects: undefined, storageGB: undefined },
      isActive: initialData?.isActive === undefined ? true : initialData.isActive,
      isMostPopular: initialData?.isMostPopular || false,
    } as PlanFormValues,
  });

  const { fields: featureFields, append: appendFeature, remove: removeFeature } = useFieldArray({
    control,
    name: "features",
  });

  const watchedName = watch("name");

  const generateSlugFromName = () => {
    if (watchedName && !initialData?.slug) {
      const generated = watchedName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '').substring(0, 50);
      setValue("slug", generated, { shouldValidate: true });
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <CardShell className="col-span-1 md:col-span-2">
          <CardHeaderShell title="Basic Information" description="Set the core details for this subscription plan." />
          <CardContentShell className="space-y-4">
            <div>
              <FormLabel htmlFor="name">Plan Name</FormLabel>
              <input id="name" {...register("name")} onBlur={generateSlugFromName} className={StyledInput} disabled={isLoading} />
              {errors.name && <p className="text-sm text-red-500 mt-1">{errors.name.message}</p>}
            </div>
            <div>
              <FormLabel htmlFor="slug">Slug (URL Identifier)</FormLabel>
              <input id="slug" {...register("slug")} placeholder="e.g., pro-monthly" className={StyledInput} disabled={isLoading} />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Lowercase, numbers, and hyphens only. Auto-generated from name if left blank on create.</p>
              {errors.slug && <p className="text-sm text-red-500 mt-1">{errors.slug.message}</p>}
            </div>
            <div>
              <FormLabel htmlFor="description">Description (Optional)</FormLabel>
              <textarea id="description" {...register("description")} className={StyledTextarea} disabled={isLoading} />
              {errors.description && <p className="text-sm text-red-500 mt-1">{errors.description.message}</p>}
            </div>
          </CardContentShell>
        </CardShell>

        <CardShell>
          <CardHeaderShell title="Pricing" />
          <CardContentShell className="space-y-4">
            <div className="flex items-end gap-3">
              <div className="flex-grow">
                <FormLabel htmlFor="price">Price</FormLabel>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400"/>
                  <input id="price" type="number" step="0.01" {...register("price")} className={`${StyledInput} pl-9`} disabled={isLoading}/>
                </div>
                {errors.price && <p className="text-sm text-red-500 mt-1">{errors.price.message}</p>}
              </div>
              <div className="w-1/3">
                <FormLabel htmlFor="currency">Currency</FormLabel>
                <input id="currency" {...register("currency")} placeholder="USD" className={StyledInput} disabled={isLoading}/> 
                {errors.currency && <p className="text-sm text-red-500 mt-1">{errors.currency.message}</p>}
              </div>
            </div>
            <div>
              <FormLabel htmlFor="billingCycle">Billing Cycle</FormLabel>
              <div className="relative">
                <Controller
                  name="billingCycle"
                  control={control}
                  render={({ field }) => (
                    <select {...field} className={StyledSelect} disabled={isLoading}>
                      <option value="monthly">Monthly</option>
                      <option value="annually">Annually</option>
                      <option value="one-time">One-Time</option>
                    </select>
                  )}
                />
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none"/>
              </div>
              {errors.billingCycle && <p className="text-sm text-red-500 mt-1">{errors.billingCycle.message}</p>}
            </div>
          </CardContentShell>
        </CardShell>

        <CardShell>
            <CardHeaderShell title="Status & Visibility" />
            <CardContentShell className="space-y-4">
                <label className={StyledCheckboxLabel}>
                    <Controller
                        name="isActive"
                        control={control}
                        render={({ field }) => (
                            <input type="checkbox" id="isActive" checked={field.value} onChange={(e) => field.onChange(e.target.checked)} className={StyledCheckbox} disabled={isLoading} />
                        )}
                    />
                    <span>Active (Plan is available for new subscriptions)</span>
                </label>
                {errors.isActive && <p className="text-sm text-red-500 mt-1">{errors.isActive.message}</p>}

                <label className={StyledCheckboxLabel}>
                     <Controller
                        name="isMostPopular"
                        control={control}
                        render={({ field }) => (
                            <input type="checkbox" id="isMostPopular" checked={field.value} onChange={(e) => field.onChange(e.target.checked)} className={StyledCheckbox} disabled={isLoading} />
                        )}
                    />
                    <span>Mark as Most Popular (Highlights this plan)</span>
                </label>
                {errors.isMostPopular && <p className="text-sm text-red-500 mt-1">{errors.isMostPopular.message}</p>}
            </CardContentShell>
        </CardShell>
      </div>

      <CardShell>
        <CardHeaderShell title="Features" description="Define the features included in this plan."/>
        <CardContentShell>
          {featureFields.map((field, index) => (
            <div key={field.id} className="flex items-end gap-3 mb-4 p-3 border border-gray-200 dark:border-gray-700 rounded-md">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 flex-grow">
                <div className="sm:col-span-2">
                  <FormLabel htmlFor={`features.${index}.name`}>Feature Name</FormLabel>
                  <input {...register(`features.${index}.name`)} className={StyledInput} disabled={isLoading}/>
                  {errors.features?.[index]?.name && <p className="text-sm text-red-500 mt-1">{errors.features?.[index]?.name?.message}</p>}
                </div>
                <div>
                  <FormLabel htmlFor={`features.${index}.limit`}>Limit (Optional)</FormLabel>
                  <input type="number" {...register(`features.${index}.limit`)} className={StyledInput} disabled={isLoading}/>
                  {errors.features?.[index]?.limit && <p className="text-sm text-red-500 mt-1">{errors.features?.[index]?.limit?.message}</p>}
                </div>
              </div>
              <div className="flex flex-col items-center ml-2 pt-2">
                 <Controller
                    name={`features.${index}.enabled`}
                    control={control}
                    render={({ field: checkboxField }) => (
                       <input type="checkbox" id={`features.${index}.enabled`} checked={checkboxField.value} onChange={(e) => checkboxField.onChange(e.target.checked)} className={`${StyledCheckbox} mt-1`} disabled={isLoading}/>
                    )}
                  />
                <FormLabel htmlFor={`features.${index}.enabled`} className="text-xs mt-1 mb-0">Enabled</FormLabel>
              </div>
              <button type="button" onClick={() => removeFeature(index)} className={`${GhostButton} text-red-500 hover:text-red-700 self-center p-2`} disabled={isLoading}>
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
          <button type="button" className={OutlineButton} onClick={() => appendFeature({ name: '', enabled: true, limit: undefined })} disabled={isLoading}>
            <PlusCircle className="h-4 w-4 mr-2" /> Add Feature
          </button>
        </CardContentShell>
      </CardShell>

      <CardShell>
        <CardHeaderShell title="Usage Limits (Optional)" description="Define quantitative limits for this plan. Leave blank if not applicable."/>
        <CardContentShell className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <FormLabel htmlFor="usageLimits.users">Max Users</FormLabel>
            <input id="usageLimits.users" type="number" {...register("usageLimits.users")} className={StyledInput} disabled={isLoading}/>
            {errors.usageLimits?.users && <p className="text-sm text-red-500 mt-1">{errors.usageLimits.users.message}</p>}
          </div>
          <div>
            <FormLabel htmlFor="usageLimits.projects">Max Projects</FormLabel>
            <input id="usageLimits.projects" type="number" {...register("usageLimits.projects")} className={StyledInput} disabled={isLoading}/>
            {errors.usageLimits?.projects && <p className="text-sm text-red-500 mt-1">{errors.usageLimits.projects.message}</p>}
          </div>
          <div>
            <FormLabel htmlFor="usageLimits.storageGB">Storage Limit (GB)</FormLabel>
            <input id="usageLimits.storageGB" type="number" {...register("usageLimits.storageGB")} className={StyledInput} disabled={isLoading}/>
            {errors.usageLimits?.storageGB && <p className="text-sm text-red-500 mt-1">{errors.usageLimits.storageGB.message}</p>}
          </div>
        </CardContentShell>
      </CardShell>

      <div className="flex justify-end gap-3 pt-6 border-t border-gray-200 dark:border-gray-700">
        {onCancel && (
            <button type="button" className={OutlineButton} disabled={isLoading} onClick={onCancel}>
                Cancel
            </button>
        )}
        <button type="submit" disabled={isLoading} className={`${PrimaryButton} min-w-[120px]`}>
          {isLoading ? <RefreshCw className="h-4 w-4 animate-spin mr-2" /> : null}
          {submitButtonText}
        </button>
      </div>
    </form>
  );
} 
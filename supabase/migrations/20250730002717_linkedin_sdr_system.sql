-- LinkedIn SDR Automation System Migration
        -- Credit system, leads, meetings, and enhanced campaign features

        -- Add credits to user profiles
        ALTER TABLE public.user_profiles 
        ADD COLUMN credits INTEGER DEFAULT 0,
        ADD COLUMN stripe_customer_id TEXT,
        ADD COLUMN subscription_status TEXT DEFAULT 'free';

        -- Enhanced campaign table with LinkedIn targeting
        ALTER TABLE public.campaigns
        ADD COLUMN target_job_titles TEXT[],
        ADD COLUMN target_industries TEXT[],
        ADD COLUMN target_locations TEXT[],
        ADD COLUMN message_template TEXT,
        ADD COLUMN credits_used INTEGER DEFAULT 20,
        ADD COLUMN lix_campaign_id TEXT,
        ADD COLUMN ai_model_settings JSONB DEFAULT '{"temperature": 0.7, "max_tokens": 150}'::jsonb,
        ADD COLUMN linkedin_filters JSONB DEFAULT '{}'::jsonb;

        -- LinkedIn leads table
        CREATE TABLE public.linkedin_leads (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            campaign_id UUID REFERENCES public.campaigns(id) ON DELETE CASCADE,
            user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE,
            full_name TEXT NOT NULL,
            job_title TEXT,
            company TEXT,
            location TEXT,
            linkedin_url TEXT,
            email TEXT,
            phone TEXT,
            profile_image_url TEXT,
            lix_lead_id TEXT,
            lead_data JSONB DEFAULT '{}'::jsonb,
            message_sent BOOLEAN DEFAULT false,
            message_sent_at TIMESTAMPTZ,
            message_opened BOOLEAN DEFAULT false,
            message_opened_at TIMESTAMPTZ,
            replied BOOLEAN DEFAULT false,
            replied_at TIMESTAMPTZ,
            reply_content TEXT,
            reply_intent TEXT CHECK (reply_intent IN ('interested', 'not_interested', 'unclear')),
            meeting_scheduled BOOLEAN DEFAULT false,
            meeting_scheduled_at TIMESTAMPTZ,
            ai_analysis JSONB DEFAULT '{}'::jsonb,
            created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
        );

        -- Meetings table for Google Calendar integration
        CREATE TABLE public.meetings (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE,
            lead_id UUID REFERENCES public.linkedin_leads(id) ON DELETE CASCADE,
            campaign_id UUID REFERENCES public.campaigns(id) ON DELETE CASCADE,
            title TEXT NOT NULL,
            description TEXT,
            scheduled_at TIMESTAMPTZ NOT NULL,
            duration_minutes INTEGER DEFAULT 30,
            meeting_link TEXT,
            google_calendar_event_id TEXT,
            meeting_status TEXT DEFAULT 'scheduled' CHECK (meeting_status IN ('scheduled', 'completed', 'cancelled', 'no_show')),
            attendee_email TEXT,
            attendee_name TEXT,
            created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
        );

        -- Credit transactions table for Stripe integration
        CREATE TABLE public.credit_transactions (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE,
            transaction_type TEXT NOT NULL CHECK (transaction_type IN ('purchase', 'deduction', 'refund')),
            credits_amount INTEGER NOT NULL,
            stripe_payment_intent_id TEXT,
            stripe_session_id TEXT,
            amount_paid DECIMAL(10,2),
            currency TEXT DEFAULT 'USD',
            description TEXT,
            created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
        );

        -- AI message templates table
        CREATE TABLE public.message_templates (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE,
            name TEXT NOT NULL,
            template_content TEXT NOT NULL,
            variables JSONB DEFAULT '[]'::jsonb,
            ai_instructions TEXT,
            is_default BOOLEAN DEFAULT false,
            created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
        );

        -- Reply monitoring table
        CREATE TABLE public.reply_monitoring (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE,
            lead_id UUID REFERENCES public.linkedin_leads(id) ON DELETE CASCADE,
            original_message TEXT,
            reply_content TEXT,
            ai_analysis JSONB,
            intent_score DECIMAL(3,2),
            action_taken TEXT,
            created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
        );

        -- Indexes for performance
        CREATE INDEX idx_linkedin_leads_campaign_id ON public.linkedin_leads(campaign_id);
        CREATE INDEX idx_linkedin_leads_user_id ON public.linkedin_leads(user_id);
        CREATE INDEX idx_linkedin_leads_replied ON public.linkedin_leads(replied);
        CREATE INDEX idx_linkedin_leads_meeting_scheduled ON public.linkedin_leads(meeting_scheduled);
        CREATE INDEX idx_meetings_user_id ON public.meetings(user_id);
        CREATE INDEX idx_meetings_scheduled_at ON public.meetings(scheduled_at);
        CREATE INDEX idx_credit_transactions_user_id ON public.credit_transactions(user_id);
        CREATE INDEX idx_message_templates_user_id ON public.message_templates(user_id);
        CREATE INDEX idx_reply_monitoring_user_id ON public.reply_monitoring(user_id);

        -- RLS policies for new tables
        ALTER TABLE public.linkedin_leads ENABLE ROW LEVEL SECURITY;
        ALTER TABLE public.meetings ENABLE ROW LEVEL SECURITY;
        ALTER TABLE public.credit_transactions ENABLE ROW LEVEL SECURITY;
        ALTER TABLE public.message_templates ENABLE ROW LEVEL SECURITY;
        ALTER TABLE public.reply_monitoring ENABLE ROW LEVEL SECURITY;

        CREATE POLICY "users_own_linkedin_leads" ON public.linkedin_leads FOR ALL
        TO authenticated
        USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

        CREATE POLICY "users_own_meetings" ON public.meetings FOR ALL
        TO authenticated
        USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

        CREATE POLICY "users_own_credit_transactions" ON public.credit_transactions FOR ALL
        TO authenticated
        USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

        CREATE POLICY "users_own_message_templates" ON public.message_templates FOR ALL
        TO authenticated
        USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

        CREATE POLICY "users_own_reply_monitoring" ON public.reply_monitoring FOR ALL
        TO authenticated
        USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

        -- Functions for credit management
        CREATE OR REPLACE FUNCTION public.deduct_credits(user_uuid UUID, credit_amount INTEGER, description TEXT DEFAULT 'Campaign creation')
        RETURNS BOOLEAN
        LANGUAGE plpgsql
        SECURITY DEFINER
        AS $$
        DECLARE
            current_credits INTEGER;
        BEGIN
            -- Get current credits
            SELECT credits INTO current_credits FROM public.user_profiles WHERE id = user_uuid;
            
            -- Check if user has enough credits
            IF current_credits < credit_amount THEN
                RETURN FALSE;
            END IF;
            
            -- Deduct credits
            UPDATE public.user_profiles 
            SET credits = credits - credit_amount 
            WHERE id = user_uuid;
            
            -- Record transaction
            INSERT INTO public.credit_transactions (user_id, transaction_type, credits_amount, description)
            VALUES (user_uuid, 'deduction', credit_amount, description);
            
            RETURN TRUE;
        END;
        $$;

        CREATE OR REPLACE FUNCTION public.add_credits(user_uuid UUID, credit_amount INTEGER, stripe_payment_id TEXT DEFAULT NULL, amount_paid DECIMAL DEFAULT NULL)
        RETURNS BOOLEAN
        LANGUAGE plpgsql
        SECURITY DEFINER
        AS $$
        BEGIN
            -- Add credits
            UPDATE public.user_profiles 
            SET credits = credits + credit_amount 
            WHERE id = user_uuid;
            
            -- Record transaction
            INSERT INTO public.credit_transactions (user_id, transaction_type, credits_amount, stripe_payment_intent_id, amount_paid, description)
            VALUES (user_uuid, 'purchase', credit_amount, stripe_payment_id, amount_paid, 'Credit purchase via Stripe');
            
            RETURN TRUE;
        END;
        $$;

        -- Function to update campaign stats
        CREATE OR REPLACE FUNCTION public.update_campaign_stats(campaign_uuid UUID)
        RETURNS VOID
        LANGUAGE plpgsql
        AS $$
        DECLARE
            total_leads INTEGER;
            total_meetings INTEGER;
            total_replies INTEGER;
            reply_rate_calc DECIMAL(5,2);
        BEGIN
            -- Get lead counts
            SELECT COUNT(*) INTO total_leads FROM public.linkedin_leads WHERE campaign_id = campaign_uuid;
            SELECT COUNT(*) INTO total_meetings FROM public.linkedin_leads WHERE campaign_id = campaign_uuid AND meeting_scheduled = true;
            SELECT COUNT(*) INTO total_replies FROM public.linkedin_leads WHERE campaign_id = campaign_uuid AND replied = true;
            
            -- Calculate reply rate
            IF total_leads > 0 THEN
                reply_rate_calc := (total_replies::DECIMAL / total_leads::DECIMAL) * 100;
            ELSE
                reply_rate_calc := 0;
            END IF;
            
            -- Update campaign
            UPDATE public.campaigns 
            SET 
                leads_generated = total_leads,
                meetings_booked = total_meetings,
                reply_rate = reply_rate_calc,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = campaign_uuid;
        END;
        $$;

        -- Add default message template for existing users
        INSERT INTO public.message_templates (user_id, name, template_content, is_default)
        SELECT 
            id,
            'Default LinkedIn Outreach',
            'Hi {{firstName}}, I noticed your work at {{company}} and would love to connect. I believe there might be some synergy between what we do and your role as {{jobTitle}}. Would you be open to a brief 15-minute call to explore potential collaboration opportunities?',
            true
        FROM public.user_profiles;
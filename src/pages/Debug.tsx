import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, User, Copy, Check } from 'lucide-react';

interface RpcResult {
  data: unknown;
  error: unknown;
  loading: boolean;
}

const Debug = () => {
  const [user, setUser] = useState<{ id: string; email?: string } | null>(null);
  const [results, setResults] = useState<Record<string, RpcResult>>({});
  const [copied, setCopied] = useState<string | null>(null);

  // Form states
  const [searchProfilesParams, setSearchProfilesParams] = useState({ province_code: '', city: '', verified_only: false, trust_min: '', limit: '20', offset: '0' });
  const [searchListingsParams, setSearchListingsParams] = useState({ province_code: '', city: '', listing_type: '', price_min: '', price_max: '', limit: '20', offset: '0' });
  const [profileDetailParams, setProfileDetailParams] = useState({ user_id: '' });
  const [listingDetailParams, setListingDetailParams] = useState({ listing_id: '' });
  const [requestConsentParams, setRequestConsentParams] = useState({ to_user: '', requested_level: '1' });
  const [respondConsentParams, setRespondConsentParams] = useState({ request_id: '', accept: true });
  const [computeCompatParams, setComputeCompatParams] = useState({ other_user: '', detail_level: '1' });
  const [createChatParams, setCreateChatParams] = useState({ other: '' });
  const [sendMessageParams, setSendMessageParams] = useState({ chat_id: '', body: '' });
  const [reportUserParams, setReportUserParams] = useState({ target_user: '', reason: '', category: 'spam', detail: '' });
  const [reportListingParams, setReportListingParams] = useState({ target_listing: '', reason: '', category: 'spam', detail: '' });
  const [reportMessageParams, setReportMessageParams] = useState({ target_message: '', reason: '', category: 'spam', detail: '' });

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user ? { id: data.user.id, email: data.user.email } : null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setUser(session?.user ? { id: session.user.id, email: session.user.email } : null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const callRpc = async (name: string, params: Record<string, unknown>) => {
    setResults(prev => ({ ...prev, [name]: { data: null, error: null, loading: true } }));
    
    const cleanParams: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(params)) {
      // Skip undefined, but keep null (null means parameter exists but is empty)
      if (v === undefined) continue;
      
      // Convert empty strings to null for UUID/ID fields
      if (v === '') {
        cleanParams[k] = null;
      } else if (typeof v === 'string' && !isNaN(Number(v)) && v.trim() !== '' && (k.includes('level') || k.includes('limit') || k.includes('offset') || k.includes('min') || k.includes('max') || k.includes('count'))) {
        // Convert numeric strings to numbers for numeric parameters
        cleanParams[k] = Number(v);
      } else {
        cleanParams[k] = v;
      }
    }

    const { data, error } = await supabase.rpc(name as never, cleanParams as never);
    setResults(prev => ({ ...prev, [name]: { data, error, loading: false } }));
  };

  const copyToClipboard = (name: string) => {
    const result = results[name];
    if (result) {
      navigator.clipboard.writeText(JSON.stringify(result.data || result.error, null, 2));
      setCopied(name);
      setTimeout(() => setCopied(null), 2000);
    }
  };

  const ResultDisplay = ({ name }: { name: string }) => {
    const result = results[name];
    if (!result) return null;

    return (
      <div className="mt-3 relative">
        <Button
          variant="ghost"
          size="sm"
          className="absolute top-1 right-1 h-6 w-6 p-0"
          onClick={() => copyToClipboard(name)}
        >
          {copied === name ? <Check className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3" />}
        </Button>
        <ScrollArea className="h-48 rounded-md border bg-muted/50 p-3">
          <pre className="text-xs whitespace-pre-wrap">
            {result.loading ? 'Loading...' : JSON.stringify(result.data || result.error, null, 2)}
          </pre>
        </ScrollArea>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              CONVINTER Debug Panel
            </CardTitle>
          </CardHeader>
          <CardContent>
            {user ? (
              <div className="text-sm space-y-1">
                <p><strong>User ID:</strong> <code className="bg-muted px-1 rounded">{user.id}</code></p>
                <p><strong>Email:</strong> {user.email}</p>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="mt-2"
                  onClick={() => supabase.auth.signOut()}
                >
                  Logout
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-muted-foreground">Not authenticated. Login to test RPCs.</p>
                <Button asChild>
                  <a href="/login">Go to Login</a>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Search Profiles */}
          <Card>
            <CardHeader><CardTitle className="text-sm">convinter_search_profiles</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              <Input placeholder="Province code" value={searchProfilesParams.province_code} onChange={e => setSearchProfilesParams(p => ({ ...p, province_code: e.target.value }))} />
              <Input placeholder="City" value={searchProfilesParams.city} onChange={e => setSearchProfilesParams(p => ({ ...p, city: e.target.value }))} />
              <div className="flex gap-2">
                <Input placeholder="Limit" value={searchProfilesParams.limit} onChange={e => setSearchProfilesParams(p => ({ ...p, limit: e.target.value }))} />
                <Input placeholder="Offset" value={searchProfilesParams.offset} onChange={e => setSearchProfilesParams(p => ({ ...p, offset: e.target.value }))} />
              </div>
              <Button
                size="sm"
                onClick={() => callRpc('convinter_search_profiles', {
                  p_province_code: searchProfilesParams.province_code || null,
                  p_city: searchProfilesParams.city || null,
                  p_verified_only: searchProfilesParams.verified_only,
                  p_trust_min: searchProfilesParams.trust_min || null,
                  p_limit: searchProfilesParams.limit,
                  p_offset: searchProfilesParams.offset
                })}
                disabled={results['convinter_search_profiles']?.loading}
              >
                {results['convinter_search_profiles']?.loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Execute
              </Button>
              <ResultDisplay name="convinter_search_profiles" />
            </CardContent>
          </Card>

          {/* Search Listings */}
          <Card>
            <CardHeader><CardTitle className="text-sm">convinter_search_listings</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              <Input placeholder="Province code" value={searchListingsParams.province_code} onChange={e => setSearchListingsParams(p => ({ ...p, province_code: e.target.value }))} />
              <Input placeholder="City" value={searchListingsParams.city} onChange={e => setSearchListingsParams(p => ({ ...p, city: e.target.value }))} />
              <div className="flex gap-2">
                <Input placeholder="Price min" value={searchListingsParams.price_min} onChange={e => setSearchListingsParams(p => ({ ...p, price_min: e.target.value }))} />
                <Input placeholder="Price max" value={searchListingsParams.price_max} onChange={e => setSearchListingsParams(p => ({ ...p, price_max: e.target.value }))} />
              </div>
              <Button
                size="sm"
                onClick={() => callRpc('convinter_search_listings', {
                  p_province_code: searchListingsParams.province_code || null,
                  p_city: searchListingsParams.city || null,
                  p_listing_type: searchListingsParams.listing_type || null,
                  p_price_min: searchListingsParams.price_min || null,
                  p_price_max: searchListingsParams.price_max || null,
                  p_limit: searchListingsParams.limit,
                  p_offset: searchListingsParams.offset
                })}
                disabled={results['convinter_search_listings']?.loading}
              >
                {results['convinter_search_listings']?.loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Execute
              </Button>
              <ResultDisplay name="convinter_search_listings" />
            </CardContent>
          </Card>

          {/* Get Profile Detail */}
          <Card>
            <CardHeader><CardTitle className="text-sm">convinter_get_profile_detail</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              <Input placeholder="User UUID" value={profileDetailParams.user_id} onChange={e => setProfileDetailParams({ user_id: e.target.value })} />
              <Button
                size="sm"
                onClick={() => callRpc('convinter_get_profile_detail', { p_user: profileDetailParams.user_id || null })}
                disabled={results['convinter_get_profile_detail']?.loading}
              >
                {results['convinter_get_profile_detail']?.loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Execute
              </Button>
              <ResultDisplay name="convinter_get_profile_detail" />
            </CardContent>
          </Card>

          {/* Get Listing Detail */}
          <Card>
            <CardHeader><CardTitle className="text-sm">convinter_get_listing_detail</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              <Input placeholder="Listing UUID" value={listingDetailParams.listing_id} onChange={e => setListingDetailParams({ listing_id: e.target.value })} />
              <Button
                size="sm"
                onClick={() => callRpc('convinter_get_listing_detail', { p_listing_id: listingDetailParams.listing_id || null })}
                disabled={results['convinter_get_listing_detail']?.loading}
              >
                {results['convinter_get_listing_detail']?.loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Execute
              </Button>
              <ResultDisplay name="convinter_get_listing_detail" />
            </CardContent>
          </Card>

          {/* Request Consent */}
          <Card>
            <CardHeader><CardTitle className="text-sm">convinter_request_consent</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              <Input placeholder="To user UUID" value={requestConsentParams.to_user} onChange={e => setRequestConsentParams(p => ({ ...p, to_user: e.target.value }))} />
              <Input placeholder="Level (1 or 2)" value={requestConsentParams.requested_level} onChange={e => setRequestConsentParams(p => ({ ...p, requested_level: e.target.value }))} />
              <Button
                size="sm"
                onClick={() => callRpc('convinter_request_consent', { 
                  p_to_user: requestConsentParams.to_user || null, 
                  p_requested_level: requestConsentParams.requested_level ? Number(requestConsentParams.requested_level) : 1 
                })}
                disabled={results['convinter_request_consent']?.loading}
              >
                {results['convinter_request_consent']?.loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Execute
              </Button>
              <ResultDisplay name="convinter_request_consent" />
            </CardContent>
          </Card>

          {/* Respond Consent */}
          <Card>
            <CardHeader><CardTitle className="text-sm">convinter_respond_consent_request</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              <Input placeholder="Request ID" value={respondConsentParams.request_id} onChange={e => setRespondConsentParams(p => ({ ...p, request_id: e.target.value }))} />
              <div className="flex gap-2">
                <Button size="sm" variant={respondConsentParams.accept ? 'default' : 'outline'} onClick={() => setRespondConsentParams(p => ({ ...p, accept: true }))}>Accept</Button>
                <Button size="sm" variant={!respondConsentParams.accept ? 'default' : 'outline'} onClick={() => setRespondConsentParams(p => ({ ...p, accept: false }))}>Reject</Button>
              </div>
              <Button
                size="sm"
                onClick={() => callRpc('convinter_respond_consent_request', { p_request_id: respondConsentParams.request_id, p_accept: respondConsentParams.accept })}
                disabled={results['convinter_respond_consent_request']?.loading}
              >
                {results['convinter_respond_consent_request']?.loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Execute
              </Button>
              <ResultDisplay name="convinter_respond_consent_request" />
            </CardContent>
          </Card>

          {/* Compute Compat */}
          <Card>
            <CardHeader><CardTitle className="text-sm">convinter_compute_and_cache_guarded</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              <Input placeholder="Other user UUID" value={computeCompatParams.other_user} onChange={e => setComputeCompatParams(p => ({ ...p, other_user: e.target.value }))} />
              <Input placeholder="Detail level (1 or 2)" value={computeCompatParams.detail_level} onChange={e => setComputeCompatParams(p => ({ ...p, detail_level: e.target.value }))} />
              <Button
                size="sm"
                onClick={() => callRpc('convinter_compute_and_cache_guarded', { p_other_user: computeCompatParams.other_user, p_detail_level: computeCompatParams.detail_level })}
                disabled={results['convinter_compute_and_cache_guarded']?.loading}
              >
                {results['convinter_compute_and_cache_guarded']?.loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Execute
              </Button>
              <ResultDisplay name="convinter_compute_and_cache_guarded" />
            </CardContent>
          </Card>

          {/* Create Chat */}
          <Card>
            <CardHeader><CardTitle className="text-sm">convinter_create_chat</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              <Input placeholder="Other user UUID" value={createChatParams.other} onChange={e => setCreateChatParams({ other: e.target.value })} />
              <Button
                size="sm"
                onClick={() => callRpc('convinter_create_chat', { p_other: createChatParams.other })}
                disabled={results['convinter_create_chat']?.loading}
              >
                {results['convinter_create_chat']?.loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Execute
              </Button>
              <ResultDisplay name="convinter_create_chat" />
            </CardContent>
          </Card>

          {/* Send Message */}
          <Card>
            <CardHeader><CardTitle className="text-sm">convinter_send_message</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              <Input placeholder="Chat UUID" value={sendMessageParams.chat_id} onChange={e => setSendMessageParams(p => ({ ...p, chat_id: e.target.value }))} />
              <Input placeholder="Message body" value={sendMessageParams.body} onChange={e => setSendMessageParams(p => ({ ...p, body: e.target.value }))} />
              <Button
                size="sm"
                onClick={() => callRpc('convinter_send_message', { p_chat_id: sendMessageParams.chat_id, p_body: sendMessageParams.body })}
                disabled={results['convinter_send_message']?.loading}
              >
                {results['convinter_send_message']?.loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Execute
              </Button>
              <ResultDisplay name="convinter_send_message" />
            </CardContent>
          </Card>

          {/* Get My Trust */}
          <Card>
            <CardHeader><CardTitle className="text-sm">convinter_get_my_trust</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              <Button
                size="sm"
                onClick={() => callRpc('convinter_get_my_trust', {})}
                disabled={results['convinter_get_my_trust']?.loading}
              >
                {results['convinter_get_my_trust']?.loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Execute
              </Button>
              <ResultDisplay name="convinter_get_my_trust" />
            </CardContent>
          </Card>

          {/* Report User */}
          <Card>
            <CardHeader><CardTitle className="text-sm">convinter_report_user</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              <Input placeholder="Target user UUID" value={reportUserParams.target_user} onChange={e => setReportUserParams(p => ({ ...p, target_user: e.target.value }))} />
              <Input placeholder="Reason" value={reportUserParams.reason} onChange={e => setReportUserParams(p => ({ ...p, reason: e.target.value }))} />
              <Input placeholder="Category" value={reportUserParams.category} onChange={e => setReportUserParams(p => ({ ...p, category: e.target.value }))} />
              <Button
                size="sm"
                onClick={() => callRpc('convinter_report_user', { p_target_user: reportUserParams.target_user, p_reason: reportUserParams.reason, p_category: reportUserParams.category, p_detail: reportUserParams.detail || null })}
                disabled={results['convinter_report_user']?.loading}
              >
                {results['convinter_report_user']?.loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Execute
              </Button>
              <ResultDisplay name="convinter_report_user" />
            </CardContent>
          </Card>

          {/* Report Listing */}
          <Card>
            <CardHeader><CardTitle className="text-sm">convinter_report_listing</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              <Input placeholder="Target listing UUID" value={reportListingParams.target_listing} onChange={e => setReportListingParams(p => ({ ...p, target_listing: e.target.value }))} />
              <Input placeholder="Reason" value={reportListingParams.reason} onChange={e => setReportListingParams(p => ({ ...p, reason: e.target.value }))} />
              <Input placeholder="Category" value={reportListingParams.category} onChange={e => setReportListingParams(p => ({ ...p, category: e.target.value }))} />
              <Button
                size="sm"
                onClick={() => callRpc('convinter_report_listing', { p_target_listing: reportListingParams.target_listing, p_reason: reportListingParams.reason, p_category: reportListingParams.category, p_detail: reportListingParams.detail || null })}
                disabled={results['convinter_report_listing']?.loading}
              >
                {results['convinter_report_listing']?.loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Execute
              </Button>
              <ResultDisplay name="convinter_report_listing" />
            </CardContent>
          </Card>

          {/* Report Message */}
          <Card>
            <CardHeader><CardTitle className="text-sm">convinter_report_message</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              <Input placeholder="Target message ID" value={reportMessageParams.target_message} onChange={e => setReportMessageParams(p => ({ ...p, target_message: e.target.value }))} />
              <Input placeholder="Reason" value={reportMessageParams.reason} onChange={e => setReportMessageParams(p => ({ ...p, reason: e.target.value }))} />
              <Input placeholder="Category" value={reportMessageParams.category} onChange={e => setReportMessageParams(p => ({ ...p, category: e.target.value }))} />
              <Button
                size="sm"
                onClick={() => callRpc('convinter_report_message', { p_target_message: reportMessageParams.target_message, p_reason: reportMessageParams.reason, p_category: reportMessageParams.category, p_detail: reportMessageParams.detail || null })}
                disabled={results['convinter_report_message']?.loading}
              >
                {results['convinter_report_message']?.loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Execute
              </Button>
              <ResultDisplay name="convinter_report_message" />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Debug;

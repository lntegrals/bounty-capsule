import { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Link, useNavigate, useParams } from 'react-router-dom'
import {
  Container, Title, Text, Button, TextInput, Textarea, Card, Badge, Group,
  Stepper, Textarea, Select, FileInput, Switch, Stack, Box, Flex, Grid,
  Table, Avatar, ActionIcon, Modal, Timeline, ScrollArea, Divider,
  RingProgress, Progress, Paper, NavLink, Burger, Drawer, Menu
} from '@mantine/core'
import { DatePickerInput } from '@mantine/dates'
import {
  IconSearch, IconPlus, IconUpload, IconFile, IconCheck, IconClock,
  IconChevronRight, IconWallet, IconArrowRight, IconTrophy, IconFiles,
  IconSend, IconEye, IconDownload, IconLock, IconCircleCheck, IconUser,
  IconStar, IconFilter, IconSortAscending, IconHome, IconList, IconSettings
} from '@tabler/icons-react'

const API = '/api'

function App() {
  const [wallet, setWallet] = useState(null)
  const [challenges, setChallenges] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const savedSeed = localStorage.getItem('bounty_seed')
    if (savedSeed) {
      loadWallet(savedSeed)
    }
    fetchChallenges()
  }, [])

  const showMessage = (text, type = 'success') => {
    // Simple console log for now
    console.log(`[${type}] ${text}`)
  }

  const createWallet = async () => {
    setLoading(true)
    try {
      const res = await fetch(`${API}/wallet/create`, { method: 'POST' })
      const data = await res.json()
      setWallet(data)
      localStorage.setItem('bounty_seed', data.seed)
      showMessage('Wallet created!')
    } catch (e) {
      showMessage(e.message, 'error')
    }
    setLoading(false)
  }

  const loadWallet = async (seed) => {
    try {
      const res = await fetch(`${API}/wallet/from-seed`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ seed })
      })
      const data = await res.json()
      setWallet({ seed, ...data })
    } catch (e) {
      console.error(e)
    }
  }

  const fetchChallenges = async () => {
    try {
      const res = await fetch(`${API}/challenges`)
      const data = await res.json()
      setChallenges(data.challenges || [])
    } catch (e) {
      console.error(e)
    }
  }

  return (
    <BrowserRouter>
      <AppLayout wallet={wallet} onCreateWallet={createWallet} loading={loading}>
        <Routes>
          <Route path="/" element={
            <LandingPage challenges={challenges} onCreateChallenge={() => {}} />
          } />
          <Route path="/challenges" element={
            <ChallengeIndexPage 
              challenges={challenges} 
              onRefresh={fetchChallenges}
              wallet={wallet}
            />
          } />
          <Route path="/challenges/new" element={
            <CreateChallengeWizard 
              wallet={wallet} 
              onSuccess={() => {
                fetchChallenges()
              }} 
            />
          } />
          <Route path="/challenges/:id" element={
            <ChallengeDetailPage wallet={wallet} />
          } />
          <Route path="/challenges/:id/review" element={
            <ReviewPage wallet={wallet} />
          } />
        </Routes>
      </AppLayout>
    </BrowserRouter>
  )
}

function AppLayout({ children, wallet, onCreateWallet, loading }) {
  const [drawerOpen, setDrawerOpen] = useState(false)

  return (
    <div className="app-shell">
      <Box component="header" style={{ background: '#12121a', borderBottom: '1px solid #2a2a33' }}>
        <Container size="xl">
          <Flex align="center" justify="space-between" h={64}>
            <Group gap="xs">
              <IconTrophy size={28} color="#10b981" />
              <Title order={3} fw={700}>BountyCapsule</Title>
            </Group>

            <Group gap="md" visibleFrom="sm">
              <NavLink label="Browse" component={Link} to="/challenges" variant="subtle" />
              <NavLink label="Create" component={Link} to="/challenges/new" variant="subtle" />
              {wallet ? (
                <Badge size="lg" variant="light" color="teal" leftSection={<IconWallet size={14} />}>
                  {wallet.address?.slice(0, 12)}...
                </Badge>
              ) : (
                <Button variant="light" color="teal" onClick={onCreateWallet} loading={loading}>
                  Connect Wallet
                </Button>
              )}
            </Group>

            <Burger opened={drawerOpen} onClick={() => setDrawerOpen(true)} hiddenFrom="sm" />
          </Flex>
        </Container>
      </Box>

      <main className="main-content">
        {children}
      </main>

      <Drawer
        opened={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title="BountyCapsule"
        padding="xl"
        size="xs"
      >
        <Stack>
          <NavLink label="Browse Challenges" component={Link} to="/challenges" leftSection={<IconList size={20} />} />
          <NavLink label="Create Challenge" component={Link} to="/challenges/new" leftSection={<IconPlus size={20} />} />
          {!wallet && (
            <Button variant="light" color="teal" onClick={onCreateWallet} fullWidth>
              Connect Wallet
            </Button>
          )}
        </Stack>
      </Drawer>
    </div>
  )
}

function LandingPage({ challenges, onCreateChallenge }) {
  const navigate = useNavigate()
  
  const sampleChallenge = challenges[0] || {
    id: 'demo-1',
    title: 'Optimize database queries for faster load times',
    description: 'Our user dashboard takes 5+ seconds to load. We need someone to analyze and optimize the PostgreSQL queries.',
    bountyAmount: '500',
    submissionCount: 3,
    status: 'open',
    createdAt: new Date().toISOString()
  }

  return (
    <Box>
      <Box style={{ position: 'relative', textAlign: 'center', padding: '80px 0 60px' }}>
        <div className="hero-gradient" />
        <Container size="md">
          <Title order={1} size={48} fw={800} mb="md" style={{ letterSpacing: '-1px' }}>
            Turn any hard problem into a funded market for solutions
          </Title>
          <Text size="xl" c="dimmed" mb="xl" maw={600} mx="auto">
            Upload the challenge, lock the bounty, collect solution capsules, and pay the winner. Real work, real funding, verified completion.
          </Text>
          <Group justify="center" gap="md">
            <Button 
              size="lg" 
              color="teal" 
              component={Link} 
              to="/challenges/new"
              rightSection={<IconArrowRight size={18} />}
            >
              Create Challenge
            </Button>
            <Button 
              size="lg" 
              variant="light" 
              component={Link} 
              to="/challenges"
            >
              Browse Challenges
            </Button>
          </Group>
        </Container>
      </Box>

      <Container size="lg" mb={60}>
        <Paper p="xl" radius="lg" style={{ background: '#16161f', border: '1px solid #2a2a33' }}>
          <Group justify="space-between" mb="lg">
            <Text fw={600} size="lg">Live Example</Text>
            <Badge color="teal" variant="light">Demo</Badge>
          </Group>
          
          <Grid gutter="lg">
            <Grid.Col span={{ base: 12, md: 8 }}>
              <Title order={3} mb="sm">{sampleChallenge.title}</Title>
              <Text c="dimmed" size="sm" mb="md" lineClamp={2}>
                {sampleChallenge.description}
              </Text>
              <Group gap="lg">
                <div>
                  <Text size="xs" c="dimmed" tt="uppercase" fw={600}>Bounty</Text>
                  <Text fw={700} size="xl" c="teal">{sampleChallenge.bountyAmount} XRP</Text>
                </div>
                <div>
                  <Text size="xs" c="dimmed" tt="uppercase" fw={600}>Submissions</Text>
                  <Text fw={600}>{sampleChallenge.submissionCount}</Text>
                </div>
                <div>
                  <Text size="xs" c="dimmed" tt="uppercase" fw={600}>Status</Text>
                  <Badge color="teal" variant="light">{sampleChallenge.status}</Badge>
                </div>
              </Group>
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 4 }}>
              <Card p="lg" radius="md" style={{ background: '#0a0a0f', border: '1px solid #2a2a33' }}>
                <Stack gap="sm">
                  <Group justify="space-between">
                    <Text size="sm" c="dimmed">Funding</Text>
                    <Group gap={4}><IconLock size={14} color="#10b981" /><Text size="sm" c="teal">Locked</Text></Group>
                  </Group>
                  <Group justify="space-between">
                    <Text size="sm" c="dimmed">Files</Text>
                    <Text size="sm">4 attached</Text>
                  </Group>
                  <Group justify="space-between">
                    <Text size="sm" c="dimmed">Deadline</Text>
                    <Text size="sm">7 days left</Text>
                  </Group>
                  <Button fullWidth mt="md" variant="light" color="teal" component={Link} to={`/challenges/${sampleChallenge.id}`}>
                    View Challenge
                  </Button>
                </Stack>
              </Card>
            </Grid.Col>
          </Grid>
        </Paper>
      </Container>

      <Container size="lg" mb={60}>
        <Title order={2} mb="lg">How it works</Title>
        <Grid gutter="xl">
          <Grid.Col span={4}>
            <Paper p="lg" radius="md" h="100%" style={{ background: '#16161f', border: '1px solid #2a2a33' }}>
              <Box mb="md"><IconUpload size={32} color="#3b82f6" /></Box>
              <Title order={4} mb="xs">1. Define the challenge</Title>
              <Text size="sm" c="dimmed">Upload problem files, set success criteria, and describe what makes a winning solution.</Text>
            </Paper>
          </Grid.Col>
          <Grid.Col span={4}>
            <Paper p="lg" radius="md" h="100%" style={{ background: '#16161f', border: '1px solid #2a2a33' }}>
              <Box mb="md"><IconLock size={32} color="#10b981" /></Box>
              <Title order={4} mb="xs">2. Lock the bounty</Title>
              <Text size="sm" c="dimmed">Funds are locked on XRPL until a winner is selected. No upfront trust required.</Text>
            </Paper>
          </Grid.Col>
          <Grid.Col span={4}>
            <Paper p="lg" radius="md" h="100%" style={{ background: '#16161f', border: '1px solid #2a2a33' }}>
              <Box mb="md"><IconTrophy size={32} color="#f59e0b" /></Box>
              <Title order={4} mb="xs">3. Review and pay</Title>
              <Text size="sm" c="dimmed">Review solution capsules, select the winner, and release the bounty in one click.</Text>
            </Paper>
          </Grid.Col>
        </Grid>
      </Container>
    </Box>
  )
}

function ChallengeIndexPage({ challenges, onRefresh, wallet }) {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState(null)
  const [sortBy, setSortBy] = useState('newest')

  const filteredChallenges = challenges
    .filter(c => !search || c.title?.toLowerCase().includes(search.toLowerCase()))
    .filter(c => !statusFilter || c.status === statusFilter)
    .sort((a, b) => {
      if (sortBy === 'newest') return new Date(b.createdAt) - new Date(a.createdAt)
      if (sortBy === 'bounty') return parseFloat(b.bountyAmount) - parseFloat(a.bountyAmount)
      return 0
    })

  return (
    <Box>
      <Group justify="space-between" mb="xl">
        <Title order={2}>Challenges</Title>
        <Button component={Link} to="/challenges/new" leftSection={<IconPlus size={18} />}>
          Create Challenge
        </Button>
      </Group>

      <Paper p="md" radius="md" mb="lg" style={{ background: '#16161f', border: '1px solid #2a2a33' }}>
        <Group>
          <TextInput
            placeholder="Search challenges..."
            leftSection={<IconSearch size={18} />}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ flex: 1 }}
          />
          <Select
            placeholder="Status"
            leftSection={<IconFilter size={18} />}
            data={[
              { value: 'open', label: 'Open' },
              { value: 'reviewing', label: 'Reviewing' },
              { value: 'completed', label: 'Completed' },
            ]}
            value={statusFilter}
            onChange={setStatusFilter}
            clearable
            w={150}
          />
          <Select
            placeholder="Sort by"
            leftSection={<IconSortAscending size={18} />}
            data={[
              { value: 'newest', label: 'Newest' },
              { value: 'bounty', label: 'Highest Bounty' },
            ]}
            value={sortBy}
            onChange={setSortBy}
            w={150}
          />
        </Group>
      </Paper>

      {filteredChallenges.length === 0 ? (
        <Paper p="xl" radius="md" style={{ background: '#16161f', border: '1px solid #2a2a33' }}>
          <Stack align="center" gap="md">
            <IconFiles size={48} color="#5e5e66" />
            <Text c="dimmed">No challenges found</Text>
            <Button component={Link} to="/challenges/new" variant="light">
              Create the first one
            </Button>
          </Stack>
        </Paper>
      ) : (
        <Grid gutter="md">
          {filteredChallenges.map((challenge) => (
            <Grid.Col key={challenge.id} span={{ base: 12, sm: 6, lg: 4 }}>
              <Card 
                component={Link} 
                to={`/challenges/${challenge.id}`}
                p="lg" 
                radius="md" 
                style={{ 
                  background: '#16161f', 
                  border: '1px solid #2a2a33',
                  textDecoration: 'none',
                  color: 'inherit',
                  transition: 'border-color 0.2s ease'
                }}
                onMouseEnter={(e) => e.currentTarget.style.borderColor = '#3b82f6'}
                onMouseLeave={(e) => e.currentTarget.style.borderColor = '#2a2a33'}
              >
                <Group justify="space-between" mb="sm">
                  <Badge 
                    color={challenge.status === 'open' ? 'teal' : challenge.status === 'reviewing' ? 'yellow' : 'violet'}
                    variant="light"
                    size="sm"
                  >
                    {challenge.status}
                  </Badge>
                  <Text size="xs" c="dimmed">
                    {new Date(challenge.createdAt).toLocaleDateString()}
                  </Text>
                </Group>
                
                <Title order={4} mb="xs" lineClamp={2}>{challenge.title}</Title>
                <Text size="sm" c="dimmed" mb="md" lineClamp={2}>
                  {challenge.description}
                </Text>
                
                <Divider my="sm" color="#2a2a33" />
                
                <Group justify="space-between">
                  <div>
                    <Text size="xs" c="dimmed" tt="uppercase" fw={600}>Bounty</Text>
                    <Text fw={700} c="teal">{challenge.bountyAmount} XRP</Text>
                  </div>
                  <div>
                    <Text size="xs" c="dimmed" tt="uppercase" fw={600}>Submissions</Text>
                    <Text fw={600}>{challenge.submissionCount || 0}</Text>
                  </div>
                </Group>
              </Card>
            </Grid.Col>
          ))}
        </Grid>
      )}
    </Box>
  )
}

function CreateChallengeWizard({ wallet, onSuccess }) {
  const [active, setActive] = useState(0)
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    successCriteria: '',
    category: '',
    difficulty: '',
    deadline: null,
    files: [],
    bountyAmount: '',
    recipient: ''
  })

  const handleNext = () => setActive((current) => (current < 3 ? current + 1 : current))
  const handlePrev = () => setActive((current) => (current > 0 ? current - 1 : current))

  const handleSubmit = async () => {
    if (!wallet) {
      alert('Please connect your wallet first')
      return
    }
    
    setLoading(true)
    try {
      const res = await fetch(`${API}/challenge/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: formData.title,
          description: formData.description,
          issuerSeed: wallet.seed,
          bountyAmount: formData.bountyAmount,
          recipient: formData.recipient || wallet.address
        })
      })
      const data = await res.json()
      if (data.challenge) {
        onSuccess()
        navigate(`/challenges/${data.challenge.id}`)
      }
    } catch (e) {
      alert(e.message)
    }
    setLoading(false)
  }

  const steps = [
    { label: 'Define', description: 'Problem & criteria' },
    { label: 'Materials', description: 'Upload files' },
    { label: 'Fund', description: 'Lock bounty' },
    { label: 'Review', description: 'Confirm & publish' },
  ]

  return (
    <Box>
      <Group justify="space-between" mb="xl">
        <Title order={2}>Create Challenge</Title>
        <Button variant="subtle" color="gray" component={Link} to="/challenges">
          Cancel
        </Button>
      </Group>

      <Stepper active={active} onStepClick={setActive} mb="xl" color="teal">
        {steps.map((step, index) => (
          <Stepper.Step key={index} label={step.label} description={step.description} />
        ))}
      </Stepper>

      {active === 0 && (
        <Paper p="xl" radius="md" style={{ background: '#16161f', border: '1px solid #2a2a33' }}>
          <Stack gap="lg">
            <TextInput
              label="Challenge Title"
              placeholder="e.g., Optimize database queries for faster load times"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
            />
            <Textarea
              label="Problem Description"
              placeholder="Describe the problem in detail. What needs to be solved?"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              minRows={4}
              required
            />
            <Textarea
              label="Success Criteria"
              placeholder="What exactly should a winning submission include and prove?"
              value={formData.successCriteria}
              onChange={(e) => setFormData({ ...formData, successCriteria: e.target.value })}
              minRows={3}
              description="Be specific about what counts as a valid solution"
            />
            <Grid gutter="md">
              <Grid.Col span={6}>
                <Select
                  label="Category"
                  placeholder="Select category"
                  data={[
                    { value: 'engineering', label: 'Engineering' },
                    { value: 'design', label: 'Design' },
                    { value: 'product', label: 'Product' },
                    { value: 'data', label: 'Data Science' },
                    { value: 'other', label: 'Other' },
                  ]}
                  value={formData.category}
                  onChange={(v) => setFormData({ ...formData, category: v })}
                />
              </Grid.Col>
              <Grid.Col span={6}>
                <Select
                  label="Difficulty"
                  placeholder="Select difficulty"
                  data={[
                    { value: 'easy', label: 'Easy' },
                    { value: 'medium', label: 'Medium' },
                    { value: 'hard', label: 'Hard' },
                    { value: 'expert', label: 'Expert' },
                  ]}
                  value={formData.difficulty}
                  onChange={(v) => setFormData({ ...formData, difficulty: v })}
                />
              </Grid.Col>
            </Grid>
            <DatePickerInput
              label="Deadline"
              placeholder="Select deadline"
              minDate={new Date()}
              value={formData.deadline}
              onChange={(v) => setFormData({ ...formData, deadline: v })}
            />
            <Button onClick={handleNext} disabled={!formData.title || !formData.description} fullWidth mt="md">
              Continue
            </Button>
          </Stack>
        </Paper>
      )}

      {active === 1 && (
        <Paper p="xl" radius="md" style={{ background: '#16161f', border: '1px solid #2a2a33' }}>
          <Stack gap="lg">
            <div>
              <Text fw={600} mb="xs">Challenge Materials</Text>
              <Text size="sm" c="dimmed">Upload files that help solvers understand the problem: code, specs, logs, datasets, etc.</Text>
            </div>
            
            <Paper 
              p="xl" 
              radius="md" 
              style={{ 
                background: '#0a0a0f', 
                border: '2px dashed #2a2a33',
                textAlign: 'center',
                cursor: 'pointer'
              }}
            >
              <Stack align="center" gap="sm">
                <IconUpload size={32} color="#5e5e66" />
                <Text>Drag files here or click to browse</Text>
                <Text size="xs" c="dimmed">ZIP, PDF, MD, code files supported</Text>
              </Stack>
            </Paper>

            <Paper p="md" radius="md" style={{ background: '#0a0a0f', border: '1px solid #10b981' }}>
              <Group gap="sm">
                <IconLock size={18} color="#10b981" />
                <div>
                  <Text size="sm" fw={600}>Stored on IPFS via Pinata</Text>
                  <Text size="xs" c="dimmed">Content-addressed, tamper-evident, reusable</Text>
                </div>
              </Group>
            </Paper>

            <Group>
              <Switch label="Make materials private (restricted access)" />
            </Group>

            <Button onClick={handleNext} fullWidth mt="md">
              Continue
            </Button>
          </Stack>
        </Paper>
      )}

      {active === 2 && (
        <Paper p="xl" radius="md" style={{ background: '#16161f', border: '1px solid #2a2a33' }}>
          <Stack gap="lg">
            <div>
              <Text fw={600} mb="xs">Fund the Bounty</Text>
              <Text size="sm" c="dimmed">Lock the bounty amount in escrow. Funds are released only when you select a winner.</Text>
            </div>

            <TextInput
              label="Bounty Amount (XRP)"
              placeholder="100"
              value={formData.bountyAmount}
              onChange={(e) => setFormData({ ...formData, bountyAmount: e.target.value })}
              required
            />

            <TextInput
              label="Recipient Address (optional)"
              placeholder="Same as issuer"
              description="Who receives the bounty if not the issuer?"
              value={formData.recipient}
              onChange={(e) => setFormData({ ...formData, recipient: e.target.value })}
            />

            <Paper p="md" radius="md" style={{ background: '#0a0a0f', border: '1px solid #10b981' }}>
              <Stack gap="xs">
                <Group gap="sm">
                  <IconLock size={18} color="#10b981" />
                  <Text size="sm" fw={600}>Bounty will be locked on XRPL</Text>
                </Group>
                <Text size="xs" c="dimmed">Funds remain locked until you release them to the winner</Text>
              </Stack>
            </Paper>

            {!wallet && (
              <Paper p="md" radius="md" style={{ background: '#f59e0b1a', border: '1px solid #f59e0b' }}>
                <Text size="sm" c="yellow">Please connect your wallet to fund the bounty</Text>
              </Paper>
            )}

            <Button onClick={handleNext} disabled={!formData.bountyAmount} fullWidth mt="md">
              Continue
            </Button>
          </Stack>
        </Paper>
      )}

      {active === 3 && (
        <Paper p="xl" radius="md" style={{ background: '#16161f', border: '1px solid #2a2a33' }}>
          <Stack gap="lg">
            <Text fw={600}>Review & Publish</Text>

            <Paper p="md" radius="md" style={{ background: '#0a0a0f' }}>
              <Stack gap="sm">
                <Group justify="space-between">
                  <Text size="sm" c="dimmed">Title</Text>
                  <Text size="sm" fw={600}>{formData.title}</Text>
                </Group>
                <Group justify="space-between">
                  <Text size="sm" c="dimmed">Description</Text>
                  <Text size="sm" fw={600} maw={300} ta="right" lineClamp={1}>{formData.description}</Text>
                </Group>
                <Group justify="space-between">
                  <Text size="sm" c="dimmed">Bounty</Text>
                  <Text size="sm" fw={600} c="teal">{formData.bountyAmount} XRP</Text>
                </Group>
                <Group justify="space-between">
                  <Text size="sm" c="dimmed">Funding</Text>
                  <Badge color="teal" variant="light">Locked on XRPL</Badge>
                </Group>
              </Stack>
            </Paper>

            <Button onClick={handleSubmit} loading={loading} fullWidth color="teal" size="lg">
              Lock Bounty & Publish
            </Button>
          </Stack>
        </Paper>
      )}
    </Box>
  )
}

function ChallengeDetailPage({ wallet }) {
  const { id } = useParams()
  const navigate = useNavigate()
  const [challenge, setChallenge] = useState(null)
  const [submissions, setSubmissions] = useState([])
  const [activeTab, setActiveTab] = useState('overview')

  useEffect(() => {
    fetchChallenge()
    fetchSubmissions()
  }, [id])

  const fetchChallenge = async () => {
    try {
      const res = await fetch(`${API}/challenge/${id}`)
      const data = await res.json()
      setChallenge(data.challenge)
    } catch (e) {
      console.error(e)
    }
  }

  const fetchSubmissions = async () => {
    try {
      const res = await fetch(`${API}/${id}/submissions`)
      const data = await res.json()
      setSubmissions(data.submissions || [])
    } catch (e) {
      console.error(e)
    }
  }

  if (!challenge) {
    return <Text>Loading...</Text>
  }

  const isOwner = wallet?.address === challenge.issuer

  return (
    <Grid gutter="xl">
      <Grid.Col span={{ base: 12, lg: 8 }}>
        <Button variant="subtle" mb="md" leftSection={<IconChevronRight size={16} style={{ transform: 'rotate(180deg)' }} />} onClick={() => navigate('/challenges')}>
          Back to challenges
        </Button>

        <Paper p="xl" radius="md" style={{ background: '#16161f', border: '1px solid #2a2a33' }}>
          <Group justify="space-between" mb="lg">
            <Title order={2}>{challenge.title}</Title>
            <Badge 
              color={challenge.status === 'open' ? 'teal' : challenge.status === 'reviewing' ? 'yellow' : 'violet'}
              variant="light"
              size="lg"
            >
              {challenge.status}
            </Badge>
          </Group>

          <Group gap="xl" mb="xl">
            <div>
              <Text size="xs" c="dimmed" tt="uppercase" fw={600}>Bounty</Text>
              <Text fw={700} size="xl" c="teal">{challenge.bountyAmount} XRP</Text>
            </div>
            <div>
              <Text size="xs" c="dimmed" tt="uppercase" fw={600}>Submissions</Text>
              <Text fw={600}>{submissions.length}</Text>
            </div>
            <div>
              <Text size="xs" c="dimmed" tt="uppercase" fw={600}>Created</Text>
              <Text fw={600}>{new Date(challenge.createdAt).toLocaleDateString()}</Text>
            </div>
          </Group>

          <Group mb="xl">
            <Button 
              variant={activeTab === 'overview' ? 'filled' : 'subtle'}
              onClick={() => setActiveTab('overview')}
            >
              Overview
            </Button>
            <Button 
              variant={activeTab === 'files' ? 'filled' : 'subtle'}
              onClick={() => setActiveTab('files')}
              leftSection={<IconFiles size={16} />}
            >
              Files ({challenge.fileCount || 0})
            </Button>
            <Button 
              variant={activeTab === 'submissions' ? 'filled' : 'subtle'}
              onClick={() => setActiveTab('submissions')}
              leftSection={<IconSend size={16} />}
            >
              Submissions ({submissions.length})
            </Button>
            <Button 
              variant={activeTab === 'activity' ? 'filled' : 'subtle'}
              onClick={() => setActiveTab('activity')}
              leftSection={<IconClock size={16} />}
            >
              Activity
            </Button>
          </Group>

          {activeTab === 'overview' && (
            <Stack gap="lg">
              <div>
                <Text fw={600} mb="xs">Problem Description</Text>
                <Text c="dimmed" style={{ whiteSpace: 'pre-wrap' }}>{challenge.description}</Text>
              </div>
              
              {challenge.successCriteria && (
                <div>
                  <Text fw={600} mb="xs">Success Criteria</Text>
                  <Text c="dimmed">{challenge.successCriteria}</Text>
                </div>
              )}
            </Stack>
          )}

          {activeTab === 'files' && (
            <Stack>
              {challenge.files?.length > 0 ? (
                challenge.files.map((file, i) => (
                  <div key={i} className="file-row">
                    <IconFile size={20} />
                    <div style={{ flex: 1 }}>
                      <Text size="sm">{file.name}</Text>
                      <Text size="xs" c="dimmed">{file.size}</Text>
                    </div>
                    <ActionIcon variant="subtle"><IconDownload size={16} /></ActionIcon>
                  </div>
                ))
              ) : (
                <Text c="dimmed" ta="center" py="xl">No files uploaded yet</Text>
              )}
            </Stack>
          )}

          {activeTab === 'submissions' && (
            <Stack>
              {submissions.length > 0 ? (
                submissions.map((sub, i) => (
                  <div key={i} className="submission-card">
                    <Group justify="space-between" mb="xs">
                      <Group gap="sm">
                        <Avatar size="sm" color="teal">{sub.solverName?.[0] || 'A'}</Avatar>
                        <Text fw={600}>{sub.solverName || 'Anonymous'}</Text>
                      </Group>
                      <Text size="xs" c="dimmed">{new Date(sub.submittedAt).toLocaleString()}</Text>
                    </Group>
                    <Text size="sm" c="dimmed" mb="md">{sub.description}</Text>
                    <Button variant="subtle" size="xs" leftSection={<IconEye size={14} />}>
                      Open capsule
                    </Button>
                  </div>
                ))
              ) : (
                <div className="empty-state">
                  <IconSend size={48} color="#5e5e66" />
                  <Text c="dimmed" mt="md">No submissions yet</Text>
                </div>
              )}
            </Stack>
          )}

          {activeTab === 'activity' && (
            <Timeline active={-1} bulletSize={12} lineWidth={2}>
              <Timeline.Item bullet={<IconCheck size={12} />} title="Challenge created">
                <Text c="dimmed" size="sm">{new Date(challenge.createdAt).toLocaleString()}</Text>
              </Timeline.Item>
              <Timeline.Item bullet={<IconLock size={12} />} title="Bounty locked">
                <Text c="dimmed" size="sm">Funds secured in escrow</Text>
              </Timeline.Item>
              {submissions.length > 0 && (
                <Timeline.Item bullet={<IconSend size={12} />} title="Submissions received">
                  <Text c="dimmed" size="sm">{submissions.length} solution capsules submitted</Text>
                </Timeline.Item>
              )}
            </Timeline>
          )}
        </Paper>
      </Grid.Col>

      <Grid.Col span={{ base: 12, lg: 4 }}>
        <div className="sticky-rail">
          <Paper p="xl" radius="md" style={{ background: '#16161f', border: '1px solid #2a2a33' }}>
            <Stack gap="lg">
              <div>
                <Text size="xs" c="dimmed" tt="uppercase" fw={600} mb="xs">Bounty</Text>
                <Text fw={700} size={32} c="teal">{challenge.bountyAmount} XRP</Text>
              </div>

              <Paper p="md" radius="md" style={{ background: '#0a0a0f' }}>
                <Stack gap="xs">
                  <Group justify="space-between">
                    <Text size="sm" c="dimmed">Funding status</Text>
                    <Group gap={4}><IconLock size={14} color="#10b981" /><Text size="sm" c="teal">Locked</Text></Group>
                  </Group>
                  <Group justify="space-between">
                    <Text size="sm" c="dimmed">Submissions</Text>
                    <Text size="sm">{submissions.length}</Text>
                  </Group>
                  <Group justify="space-between">
                    <Text size="sm" c="dimmed">Files</Text>
                    <Text size="sm">{challenge.fileCount || 0}</Text>
                  </Group>
                </Stack>
              </Paper>

              {challenge.status === 'open' && (
                <>
                  <Button 
                    fullWidth 
                    color="teal" 
                    leftSection={<IconSend size={18} />}
                  >
                    Submit Solution
                  </Button>
                  
                  {isOwner && submissions.length > 0 && (
                    <Button 
                      fullWidth 
                      variant="light" 
                      component={Link} 
                      to={`/challenges/${id}/review`}
                      leftSection={<IconEye size={18} />}
                    >
                      Review Submissions
                    </Button>
                  )}
                </>
              )}

              {challenge.status === 'reviewing' && isOwner && (
                <Button 
                  fullWidth 
                  color="teal" 
                  component={Link} 
                  to={`/challenges/${id}/review`}
                >
                  Select Winner
                </Button>
              )}

              <Paper p="sm" radius="md" style={{ background: '#0a0a0f' }}>
                <Text size="xs" c="dimmed">
                  <Group gap={4} mb="xs">
                    <IconLock size={12} /> Locked on XRPL
                  </Group>
                  <Group gap={4}>
                    <IconFiles size={12} /> Stored on IPFS
                  </Group>
                </Text>
              </Paper>
            </Stack>
          </Paper>
        </div>
      </Grid.Col>
    </Grid>
  )
}

function ReviewPage({ wallet }) {
  const { id } = useParams()
  const navigate = useNavigate()
  const [challenge, setChallenge] = useState(null)
  const [submissions, setSubmissions] = useState([])
  const [selectedWinner, setSelectedWinner] = useState(null)
  const [payoutModal, setPayoutModal] = useState(false)

  useEffect(() => {
    fetchData()
  }, [id])

  const fetchData = async () => {
    try {
      const [challengeRes, submissionsRes] = await Promise.all([
        fetch(`${API}/challenge/${id}`),
        fetch(`${API}/${id}/submissions`)
      ])
      const challengeData = await challengeRes.json()
      const submissionsData = await submissionsRes.json()
      setChallenge(challengeData.challenge)
      setSubmissions(submissionsData.submissions || [])
    } catch (e) {
      console.error(e)
    }
  }

  const handlePayout = async () => {
    if (!selectedWinner) return
    try {
      await fetch(`${API}/payout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          challengeId: id,
          winnerAddress: selectedWinner.solver,
          issuerSeed: wallet.seed
        })
      })
      navigate(`/challenges/${id}`)
    } catch (e) {
      alert(e.message)
    }
  }

  if (!challenge) return <Text>Loading...</Text>

  return (
    <Box>
      <Button variant="subtle" mb="md" leftSection={<IconChevronRight size={16} style={{ transform: 'rotate(180deg)' }} />} onClick={() => navigate(`/challenges/${id}`)}>
        Back to challenge
      </Button>

      <Grid gutter="xl">
        <Grid.Col span={{ base: 12, lg: 8 }}>
          <Title order={2} mb="lg">Review Submissions</Title>
          
          {submissions.length === 0 ? (
            <Paper p="xl" radius="md" style={{ background: '#16161f', border: '1px solid #2a2a33' }}>
              <Text c="dimmed" ta="center">No submissions to review</Text>
            </Paper>
          ) : (
            <Stack gap="md">
              {submissions.map((sub, i) => (
                <Paper 
                  key={i} 
                  p="xl" 
                  radius="md" 
                  style={{ 
                    background: '#16161f', 
                    border: selectedWinner?.id === sub.id ? '2px solid #10b981' : '1px solid #2a2a33',
                    cursor: 'pointer'
                  }}
                  onClick={() => setSelectedWinner(sub)}
                >
                  <Group justify="space-between" mb="md">
                    <Group gap="md">
                      <Avatar size="lg" color="teal">{sub.solverName?.[0] || 'A'}</Avatar>
                      <div>
                        <Text fw={600}>{sub.solverName || 'Anonymous'}</Text>
                        <Text size="xs" c="dimmed">{new Date(sub.submittedAt).toLocaleString()}</Text>
                      </div>
                    </Group>
                    {selectedWinner?.id === sub.id && (
                      <Badge color="teal" leftSection={<IconCheck size={12} />}>Selected</Badge>
                    )}
                  </Group>
                  
                  <Text mb="md">{sub.description}</Text>
                  
                  <Group gap="xs">
                    <Button variant="subtle" size="xs" leftSection={<IconEye size={14} />}>View capsule</Button>
                    <Button variant="subtle" size="xs" leftSection={<IconDownload size={14} />}>Download files</Button>
                  </Group>
                </Paper>
              ))}
            </Stack>
          )}
        </Grid.Col>

        <Grid.Col span={{ base: 12, lg: 4 }}>
          <Paper p="xl" radius="md" style={{ background: '#16161f', border: '1px solid #2a2a33' }} className="sticky-rail">
            <Stack gap="lg">
              <div>
                <Text size="xs" c="dimmed" tt="uppercase" fw={600} mb="xs">Reviewing for</Text>
                <Text fw={700} size="xl">{challenge.bountyAmount} XRP</Text>
              </div>

              <Paper p="md" radius="md" style={{ background: '#0a0a0f' }}>
                <Text size="sm" fw={600} mb="sm">Summary</Text>
                <Stack gap="xs">
                  <Group justify="space-between">
                    <Text size="sm" c="dimmed">Total submissions</Text>
                    <Text size="sm">{submissions.length}</Text>
                  </Group>
                  <Group justify="space-between">
                    <Text size="sm" c="dimmed">Selected</Text>
                    <Text size="sm">{selectedWinner ? '1' : '0'}</Text>
                  </Group>
                </Stack>
              </Paper>

              <Button 
                fullWidth 
                color="teal" 
                size="lg"
                disabled={!selectedWinner}
                onClick={() => setPayoutModal(true)}
              >
                Release Bounty
              </Button>

              <Text size="xs" c="dimmed" ta="center">
                This action is irreversible. The selected solver will receive the bounty.
              </Text>
            </Stack>
          </Paper>
        </Grid.Col>
      </Grid>

      <Modal opened={payoutModal} onClose={() => setPayoutModal(false)} title="Confirm Payout" centered>
        <Stack>
          <Text>You are about to release <Text component="span" fw={700} c="teal">{challenge.bountyAmount} XRP</Text> to:</Text>
          <Paper p="md" radius="md" style={{ background: '#0a0a0f' }}>
            <Text fw={600}>{selectedWinner?.solverName}</Text>
            <Text size="sm" c="dimmed" ff="monospace">{selectedWinner?.solver}</Text>
          </Paper>
          <Text size="sm" c="red">This action cannot be undone.</Text>
          <Button color="teal" onClick={handlePayout}>
            Confirm & Release
          </Button>
        </Stack>
      </Modal>
    </Box>
  )
}

export default App

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Save, Eye, Upload, MapPin, Plus, X, Image as ImageIcon, Trash2, LogOut, User } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'

export default function AdminArticleEditor() {
  const navigate = useNavigate()
  const { signOut } = useAuth()

  const handleSignOut = async () => {
    try {
      await signOut()
      navigate('/')
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }
  const [formData, setFormData] = useState({
    title: '',
    subtitle: '',
    slug: '',
    category: 'Culture',
    tags: [],
    issue: '',
    authorName: 'Sanath Weerasuriya',
    authorRole: 'Field Correspondent',
    readTime: 8,
    locationName: 'Kandy, Sri Lanka',
    locationCoordinates: '',
    heroImageUrl: '',
    status: 'draft',
    isFeatured: false
  })

  const [newTag, setNewTag] = useState('')
  const [activeTab, setActiveTab] = useState('basic')

  const updateField = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const addTag = () => {
    if (newTag && !formData.tags.includes(newTag)) {
      updateField('tags', [...formData.tags, newTag])
      setNewTag('')
    }
  }

  const removeTag = (tagToRemove) => {
    updateField('tags', formData.tags.filter(tag => tag !== tagToRemove))
  }

  return (
    <div className="min-h-screen bg-stone-50">
      {/* Editor Header */}
      <div className="bg-stone-950 text-stone-50 shadow-lg sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Article Editor</h1>
              <p className="text-stone-400 text-sm mt-1">Create or edit article</p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate('/admin')}
                className="px-4 py-2 bg-stone-800 hover:bg-stone-700 rounded-lg transition-colors text-sm"
              >
                Cancel
              </button>
              <button
                className="flex items-center gap-2 px-4 py-2 bg-stone-700 hover:bg-stone-600 rounded-lg transition-colors text-sm"
              >
                <Eye size={18} />
                Preview
              </button>
              <button
                className="flex items-center gap-2 px-6 py-2 rounded-lg font-medium transition-all shadow-sm"
                style={{ backgroundColor: '#00E676', color: '#1a1a1a' }}
                onMouseEnter={(e) => e.target.style.backgroundColor = '#00C853'}
                onMouseLeave={(e) => e.target.style.backgroundColor = '#00E676'}
              >
                <Save size={18} />
                Save Article
              </button>
              <div className="border-l border-stone-700 h-8 mx-2"></div>
              <button
                onClick={handleSignOut}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg transition-colors text-sm"
                title="Sign out"
              >
                <LogOut size={18} />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Tab Navigation */}
            <div className="bg-white rounded-xl shadow-sm border border-stone-200 p-2">
              <div className="flex gap-2">
                {['basic', 'content', 'images', 'map', 'accommodations'].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
                      activeTab === tab
                        ? 'bg-stone-950 text-white'
                        : 'text-stone-600 hover:bg-stone-100'
                    }`}
                  >
                    {tab.charAt(0).toUpperCase() + tab.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {/* Basic Info Tab */}
            {activeTab === 'basic' && (
              <div className="bg-white rounded-xl shadow-sm border border-stone-200 p-6 space-y-6">
                <h2 className="text-xl font-bold text-stone-950">Basic Information</h2>

                {/* Title */}
                <div>
                  <label className="block text-sm font-semibold text-stone-700 mb-2">
                    Article Title *
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => updateField('title', e.target.value)}
                    placeholder="THE FIRE OF KANDY."
                    className="w-full px-4 py-3 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-lg font-bold"
                  />
                </div>

                {/* Subtitle */}
                <div>
                  <label className="block text-sm font-semibold text-stone-700 mb-2">
                    Subtitle / Lead
                  </label>
                  <textarea
                    value={formData.subtitle}
                    onChange={(e) => updateField('subtitle', e.target.value)}
                    placeholder="We walked through the smoke of a thousand copra torches..."
                    rows={3}
                    className="w-full px-4 py-3 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>

                {/* Slug */}
                <div>
                  <label className="block text-sm font-semibold text-stone-700 mb-2">
                    URL Slug *
                  </label>
                  <div className="flex items-center gap-2">
                    <span className="text-stone-500">/article/</span>
                    <input
                      type="text"
                      value={formData.slug}
                      onChange={(e) => updateField('slug', e.target.value.toLowerCase().replace(/\s+/g, '-'))}
                      placeholder="kandy-perahera"
                      className="flex-1 px-4 py-2 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                  </div>
                  <p className="text-xs text-stone-500 mt-1">URL-friendly identifier (lowercase, hyphens only)</p>
                </div>

                {/* Category & Issue */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-stone-700 mb-2">
                      Category
                    </label>
                    <select
                      value={formData.category}
                      onChange={(e) => updateField('category', e.target.value)}
                      className="w-full px-4 py-2 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 cursor-pointer"
                    >
                      <option>Culture</option>
                      <option>Travel</option>
                      <option>Food</option>
                      <option>Adventure</option>
                      <option>Nature</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-stone-700 mb-2">
                      Issue
                    </label>
                    <input
                      type="text"
                      value={formData.issue}
                      onChange={(e) => updateField('issue', e.target.value)}
                      placeholder="Issue 04: The Relic"
                      className="w-full px-4 py-2 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                </div>

                {/* Tags */}
                <div>
                  <label className="block text-sm font-semibold text-stone-700 mb-2">
                    Tags
                  </label>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {formData.tags.map((tag) => (
                      <span
                        key={tag}
                        className="flex items-center gap-2 px-3 py-1 bg-stone-200 text-stone-700 rounded-full text-sm"
                      >
                        {tag}
                        <button
                          onClick={() => removeTag(tag)}
                          className="hover:text-red-600"
                        >
                          <X size={14} />
                        </button>
                      </span>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newTag}
                      onChange={(e) => setNewTag(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                      placeholder="Add tag..."
                      className="flex-1 px-4 py-2 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                    <button
                      onClick={addTag}
                      className="px-4 py-2 bg-stone-950 text-white rounded-lg hover:bg-stone-800 transition-colors"
                    >
                      <Plus size={18} />
                    </button>
                  </div>
                </div>

                {/* Author Info */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-stone-700 mb-2">
                      Author Name
                    </label>
                    <input
                      type="text"
                      value={formData.authorName}
                      onChange={(e) => updateField('authorName', e.target.value)}
                      className="w-full px-4 py-2 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-stone-700 mb-2">
                      Author Role
                    </label>
                    <input
                      type="text"
                      value={formData.authorRole}
                      onChange={(e) => updateField('authorRole', e.target.value)}
                      placeholder="Field Correspondent"
                      className="w-full px-4 py-2 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                </div>

                {/* Location */}
                <div>
                  <label className="block text-sm font-semibold text-stone-700 mb-2">
                    Location
                  </label>
                  <input
                    type="text"
                    value={formData.locationName}
                    onChange={(e) => updateField('locationName', e.target.value)}
                    placeholder="Kandy, Sri Lanka"
                    className="w-full px-4 py-2 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>

                {/* Read Time */}
                <div>
                  <label className="block text-sm font-semibold text-stone-700 mb-2">
                    Read Time (minutes)
                  </label>
                  <input
                    type="number"
                    value={formData.readTime}
                    onChange={(e) => updateField('readTime', parseInt(e.target.value))}
                    className="w-full px-4 py-2 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
              </div>
            )}

            {/* Content Tab */}
            {activeTab === 'content' && (
              <div className="bg-white rounded-xl shadow-sm border border-stone-200 p-6 space-y-6">
                <h2 className="text-xl font-bold text-stone-950">Article Content</h2>

                <div>
                  <label className="block text-sm font-semibold text-stone-700 mb-2">
                    Introduction Paragraph
                  </label>
                  <textarea
                    placeholder="First paragraph of the article..."
                    rows={4}
                    className="w-full px-4 py-3 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent font-serif"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-stone-700 mb-2">
                    Main Content
                  </label>
                  <div className="border border-stone-300 rounded-lg p-4 bg-stone-50 min-h-[400px]">
                    <p className="text-stone-500 text-center py-12">
                      Rich text editor would go here
                      <br />
                      <span className="text-sm">(Supports formatting, images, quotes, etc.)</span>
                    </p>
                  </div>
                </div>

                <div className="border-t border-stone-200 pt-6">
                  <label className="block text-sm font-semibold text-stone-700 mb-2">
                    Featured Section (e.g., "The Top Attraction")
                  </label>
                  <input
                    type="text"
                    placeholder="Featured section heading..."
                    className="w-full px-4 py-2 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 mb-3"
                  />
                  <textarea
                    placeholder="Featured section content..."
                    rows={4}
                    className="w-full px-4 py-3 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 font-serif"
                  />
                </div>
              </div>
            )}

            {/* Images Tab */}
            {activeTab === 'images' && (
              <div className="bg-white rounded-xl shadow-sm border border-stone-200 p-6 space-y-6">
                <h2 className="text-xl font-bold text-stone-950">Images & Media</h2>

                {/* Hero Image */}
                <div>
                  <label className="block text-sm font-semibold text-stone-700 mb-2">
                    Hero Banner Image *
                  </label>
                  <div className="border-2 border-dashed border-stone-300 rounded-lg p-8 text-center hover:border-green-500 transition-colors cursor-pointer">
                    <Upload className="mx-auto mb-3 text-stone-400" size={48} />
                    <p className="text-stone-600 font-medium mb-1">Click to upload hero image</p>
                    <p className="text-stone-500 text-sm">Recommended: 1920x1080px, JPG or PNG</p>
                  </div>
                </div>

                {/* Visual Plates */}
                <div>
                  <label className="block text-sm font-semibold text-stone-700 mb-4">
                    Visual Plates (3 images)
                  </label>
                  <div className="grid grid-cols-3 gap-4">
                    {[1, 2, 3].map((num) => (
                      <div key={num} className="space-y-2">
                        <div className="aspect-square border-2 border-dashed border-stone-300 rounded-lg p-4 flex flex-col items-center justify-center hover:border-green-500 transition-colors cursor-pointer">
                          <ImageIcon className="text-stone-400 mb-2" size={32} />
                          <p className="text-stone-600 text-sm font-medium">Plate {num}</p>
                        </div>
                        <input
                          type="text"
                          placeholder="Label"
                          className="w-full px-3 py-2 text-sm border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                        />
                        <select className="w-full px-3 py-2 text-sm border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 cursor-pointer">
                          <option>White Background</option>
                          <option>Yellow (#FFD600)</option>
                          <option>Dark (#1a1a1a)</option>
                          <option>Green (#00E676)</option>
                        </select>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Map Tab */}
            {activeTab === 'map' && (
              <div className="bg-white rounded-xl shadow-sm border border-stone-200 p-6 space-y-6">
                <h2 className="text-xl font-bold text-stone-950">Map & Routes</h2>

                <div className="border-2 border-stone-300 rounded-lg bg-stone-100 aspect-video flex items-center justify-center">
                  <div className="text-center text-stone-500">
                    <MapPin className="mx-auto mb-3" size={48} />
                    <p className="font-medium">Interactive Map Editor</p>
                    <p className="text-sm">Click to add markers and draw routes</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 border border-stone-200 rounded-lg">
                    <div>
                      <p className="font-medium text-stone-950">Perahera Route</p>
                      <p className="text-sm text-stone-500">4 waypoints</p>
                    </div>
                    <button className="text-red-600 hover:bg-red-50 p-2 rounded">
                      <Trash2 size={18} />
                    </button>
                  </div>
                  <button className="w-full py-3 border-2 border-dashed border-stone-300 rounded-lg text-stone-600 hover:border-green-500 hover:text-green-600 transition-colors font-medium">
                    + Add Route or Landmark
                  </button>
                </div>
              </div>
            )}

            {/* Accommodations Tab */}
            {activeTab === 'accommodations' && (
              <div className="bg-white rounded-xl shadow-sm border border-stone-200 p-6 space-y-6">
                <h2 className="text-xl font-bold text-stone-950">Accommodations</h2>

                <div className="space-y-4">
                  {/* Sample accommodation */}
                  <div className="p-4 border border-stone-200 rounded-lg space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <input
                        type="text"
                        placeholder="Hotel Name"
                        className="px-3 py-2 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                      />
                      <input
                        type="text"
                        placeholder="Type (e.g., Heritage Listed)"
                        className="px-3 py-2 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                      />
                      <input
                        type="text"
                        placeholder="Price Range"
                        className="px-3 py-2 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                      />
                      <input
                        type="number"
                        step="0.1"
                        placeholder="Rating (1-5)"
                        className="px-3 py-2 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                      />
                    </div>
                    <textarea
                      placeholder="Description..."
                      rows={2}
                      className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Image URL"
                        className="flex-1 px-3 py-2 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                      />
                      <button className="px-4 py-2 bg-stone-950 text-white rounded-lg hover:bg-stone-800">
                        <Upload size={18} />
                      </button>
                    </div>
                    <input
                      type="text"
                      placeholder="Coordinates (lat, lng)"
                      className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>

                  <button className="w-full py-3 border-2 border-dashed border-stone-300 rounded-lg text-stone-600 hover:border-green-500 hover:text-green-600 transition-colors font-medium">
                    + Add Accommodation
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Publish Options */}
            <div className="bg-white rounded-xl shadow-sm border border-stone-200 p-6 space-y-4">
              <h3 className="font-bold text-stone-950">Publish Options</h3>

              <div>
                <label className="block text-sm font-semibold text-stone-700 mb-2">
                  Status
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => updateField('status', e.target.value)}
                  className="w-full px-4 py-2 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 cursor-pointer"
                >
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                  <option value="archived">Archived</option>
                </select>
              </div>

              <div className="flex items-center justify-between p-3 bg-stone-50 rounded-lg">
                <label className="text-sm font-semibold text-stone-700">
                  Featured Article
                </label>
                <button
                  onClick={() => updateField('isFeatured', !formData.isFeatured)}
                  className={`relative w-12 h-6 rounded-full transition-colors ${
                    formData.isFeatured ? 'bg-green-500' : 'bg-stone-300'
                  }`}
                >
                  <span
                    className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${
                      formData.isFeatured ? 'translate-x-6' : ''
                    }`}
                  />
                </button>
              </div>

              <div className="border-t border-stone-200 pt-4 text-sm text-stone-600 space-y-2">
                <div className="flex justify-between">
                  <span>Created:</span>
                  <span className="font-medium">Jan 27, 2026</span>
                </div>
                <div className="flex justify-between">
                  <span>Last modified:</span>
                  <span className="font-medium">Today at 10:32 AM</span>
                </div>
              </div>
            </div>

            {/* SEO Preview */}
            <div className="bg-white rounded-xl shadow-sm border border-stone-200 p-6 space-y-4">
              <h3 className="font-bold text-stone-950">SEO Preview</h3>
              <div className="p-4 bg-stone-50 rounded-lg space-y-2">
                <div className="text-blue-600 text-sm">traveltimes.lk/article/kandy-perahera</div>
                <div className="text-lg font-medium text-purple-600">
                  {formData.title || 'Article Title'}
                </div>
                <div className="text-sm text-stone-600 line-clamp-2">
                  {formData.subtitle || 'Article subtitle will appear here...'}
                </div>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="bg-white rounded-xl shadow-sm border border-stone-200 p-6 space-y-4">
              <h3 className="font-bold text-stone-950">Content Stats</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-stone-600">Word Count:</span>
                  <span className="font-medium">0</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-600">Images:</span>
                  <span className="font-medium">0</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-600">Accommodations:</span>
                  <span className="font-medium">0</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

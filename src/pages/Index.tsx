import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import Icon from '@/components/ui/icon';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  language?: string;
}

function Index() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [language, setLanguage] = useState<'python' | 'lua'>('python');
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showAdminPanel, setShowAdminPanel] = useState(false);

  const handleSendMessage = () => {
    if (!input.trim()) return;
    
    if (!isSubscribed) {
      alert('Для использования AI необходима подписка! Оформите подписку за 199₽');
      return;
    }

    const userMessage: Message = { role: 'user', content: input };
    setMessages([...messages, userMessage]);

    setTimeout(() => {
      const codeExample = language === 'python' 
        ? `def hello_world():\n    print("Hello, World!")\n    return True\n\nhello_world()`
        : `function helloWorld()\n    print("Hello, World!")\n    return true\nend\n\nhelloWorld()`;
      
      const assistantMessage: Message = {
        role: 'assistant',
        content: `\`\`\`${language}\n${codeExample}\n\`\`\``,
        language
      };
      setMessages(prev => [...prev, assistantMessage]);
    }, 1000);

    setInput('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/10">
      <div className="container mx-auto px-4 py-8">
        <header className="mb-12 text-center animate-fade-in">
          <div className="inline-flex items-center gap-3 mb-4">
            <div className="p-3 bg-gradient-to-br from-primary to-secondary rounded-2xl">
              <Icon name="Code2" size={32} className="text-white" />
            </div>
            <h1 className="text-5xl font-bold bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent bg-[length:200%_auto] animate-gradient">
              CodeGen AI
            </h1>
          </div>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Генерация кода на Python и Lua с помощью искусственного интеллекта
          </p>
          
          <div className="flex gap-3 justify-center mt-6">
            {isSubscribed ? (
              <Badge variant="default" className="px-4 py-2 text-sm bg-gradient-to-r from-primary to-secondary">
                <Icon name="CheckCircle" size={16} className="mr-2" />
                Подписка активна
              </Badge>
            ) : (
              <Dialog>
                <DialogTrigger asChild>
                  <Button size="lg" className="bg-gradient-to-r from-primary to-secondary hover:opacity-90 transition-opacity">
                    <Icon name="Sparkles" size={20} className="mr-2" />
                    Оформить подписку за 199₽
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Оформление подписки</DialogTitle>
                    <DialogDescription>
                      Получите неограниченный доступ к генерации кода
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input id="email" type="email" placeholder="your@email.com" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="name">Имя</Label>
                      <Input id="name" placeholder="Ваше имя" />
                    </div>
                    <div className="bg-primary/10 p-4 rounded-lg">
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-semibold">Стоимость</span>
                        <span className="text-2xl font-bold">199₽</span>
                      </div>
                      <p className="text-sm text-muted-foreground">Безлимитная генерация кода</p>
                    </div>
                    <Button 
                      className="w-full bg-gradient-to-r from-primary to-secondary"
                      onClick={() => {
                        setIsSubscribed(true);
                        alert('Подписка успешно оформлена!');
                      }}
                    >
                      Оплатить 199₽
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            )}
            
            {isAdmin && (
              <Button 
                variant="outline" 
                size="lg"
                onClick={() => setShowAdminPanel(!showAdminPanel)}
              >
                <Icon name="Shield" size={20} className="mr-2" />
                Админ-панель
              </Button>
            )}
          </div>

          <div className="mt-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsAdmin(!isAdmin)}
              className="text-xs text-muted-foreground"
            >
              {isAdmin ? 'Выйти из режима администратора' : 'Войти как администратор'}
            </Button>
          </div>
        </header>

        {showAdminPanel && isAdmin && (
          <Card className="mb-8 border-primary/20 animate-fade-in">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Icon name="Shield" size={24} />
                Админ-панель
              </CardTitle>
              <CardDescription>Управление подписками пользователей</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid gap-4">
                  <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors">
                    <div>
                      <p className="font-medium">user@example.com</p>
                      <p className="text-sm text-muted-foreground">Иван Петров</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <Badge variant="secondary">Подписка неактивна</Badge>
                      <Button size="sm" variant="default">
                        Выдать подписку
                      </Button>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors">
                    <div>
                      <p className="font-medium">admin@codegen.ai</p>
                      <p className="text-sm text-muted-foreground">Администратор</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <Badge className="bg-gradient-to-r from-primary to-secondary">Активна</Badge>
                      <Button size="sm" variant="outline">
                        Отозвать
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid md:grid-cols-3 gap-6 mb-12 animate-fade-in">
          <Card className="border-primary/20 hover:border-primary/40 transition-colors">
            <CardHeader>
              <Icon name="Zap" size={32} className="text-primary mb-2" />
              <CardTitle>Быстрая генерация</CardTitle>
              <CardDescription>
                Получайте готовый код за секунды
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-secondary/20 hover:border-secondary/40 transition-colors">
            <CardHeader>
              <Icon name="Code" size={32} className="text-secondary mb-2" />
              <CardTitle>Python & Lua</CardTitle>
              <CardDescription>
                Поддержка двух популярных языков
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-accent/20 hover:border-accent/40 transition-colors">
            <CardHeader>
              <Icon name="Brain" size={32} className="text-accent mb-2" />
              <CardTitle>AI-мощность</CardTitle>
              <CardDescription>
                Современные алгоритмы машинного обучения
              </CardDescription>
            </CardHeader>
          </Card>
        </div>

        <Card className="border-primary/20 animate-fade-in">
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>AI Генератор кода</CardTitle>
                <CardDescription>Опишите что нужно создать</CardDescription>
              </div>
              <Tabs value={language} onValueChange={(v) => setLanguage(v as 'python' | 'lua')}>
                <TabsList>
                  <TabsTrigger value="python" className="gap-2">
                    <Icon name="FileCode" size={16} />
                    Python
                  </TabsTrigger>
                  <TabsTrigger value="lua" className="gap-2">
                    <Icon name="FileCode2" size={16} />
                    Lua
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <ScrollArea className="h-[400px] rounded-lg border p-4 bg-muted/30">
                {messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
                    <Icon name="MessageSquare" size={48} className="mb-4 opacity-50" />
                    <p>Начните диалог с AI</p>
                    <p className="text-sm">Опишите какой код вам нужен</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {messages.map((msg, idx) => (
                      <div
                        key={idx}
                        className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[80%] rounded-lg p-3 ${
                            msg.role === 'user'
                              ? 'bg-gradient-to-r from-primary to-secondary text-white'
                              : 'bg-muted'
                          }`}
                        >
                          <pre className="whitespace-pre-wrap font-mono text-sm">
                            {msg.content}
                          </pre>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>

              <div className="flex gap-2">
                <Textarea
                  placeholder={`Например: "Создай функцию для сортировки массива" (${language})`}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  className="min-h-[80px]"
                />
                <Button
                  onClick={handleSendMessage}
                  className="bg-gradient-to-r from-primary to-secondary hover:opacity-90"
                  disabled={!input.trim()}
                >
                  <Icon name="Send" size={20} />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default Index;
